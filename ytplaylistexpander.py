#!/usr/bin/python3
# limitations under the License.
import sys,operator,math
from googleapiclient.discovery import build
from oauth2client import file, client, tools
from httplib2 import Http

def get_authenticated_service():
  store=file.Storage('credentials.json')
  creds=store.get()
  if not creds or creds.invalid:
      flow=client.flow_from_clientsecrets('client_secret.json', ['https://www.googleapis.com/auth/youtube.force-ssl'])
      creds=tools.run_flow(flow,store,tools.argparser.parse_args(args=[]))
  return build('youtube','v3',http=creds.authorize(Http()))
service=get_authenticated_service()

DEBUG=True
MAXRESULTS=50
RELATEDRESULTS=9

def pages(service,request,follow=True): #TODO return items
  i=0
  while request:
    response=request.execute()
    for item in response['items']:
      yield item
    if not follow:
      return
    request=service.list_next(request,response)
def main(argv):
  try:
    #yt playlist expander
    print('Max relateds: '+str(RELATEDRESULTS))
    videosids=[] #TODO change to expandids
    relatedids=[] #TODO change to resultids
    playlistsservice=service.playlists()
    for target in sys.argv[1:]:
      for pl in pages(playlistsservice,playlistsservice.list(part='id,snippet',maxResults=MAXRESULTS,id=target)):
        print('expand='+str(len(videosids))+' results='+str(len(relatedids))+' now: '+pl['snippet']['title'])
        playlistitems=service.playlistItems()
        for video in pages(playlistitems,playlistitems.list(part='snippet',playlistId=pl['id'],maxResults=MAXRESULTS)):
          videoid=video['snippet']['resourceId']['videoId']
          if not videoid in videosids:
            videosids.append(videoid)
        if DEBUG:
          break
    i=-1
    search=service.search()
    for videoid in videosids:#find relateds
      i+=1
      try:
        relatedcount=0
        for related in pages(search,search.list(part='id',type='video',maxResults=RELATEDRESULTS,relatedToVideoId=videoid),follow=False):
          relatedcount+=1
          duplicate=False
          related=related['id']['videoId']
          for avoid in [relatedids,videosids]:
            if related in avoid:
              duplicate=True
          if not duplicate:
            relatedids.append(related)
        print('relateds '+str(int(100*i/(len(videosids))))+'% '+str(relatedcount)+' found')
      except Exception as e:#error 404, presumably if video was deleted/privated
        print(e)
    relateds=[]
    requests=math.ceil(len(relatedids)/float(MAXRESULTS))
    nrequests=0
    while len(relatedids)!=0: #video info
      print('videos '+str(int(100*(nrequests/requests)))+'%')
      nrequests+=1
      ids=relatedids[:MAXRESULTS]
      idscsv=''
      for i in ids:
        idscsv+=i+','
      idscsv=idscsv[:-1]
      videosservice=service.videos()
      try:
        for video in pages(videosservice,videosservice.list(part='statistics,snippet,id,contentDetails',id=idscsv,maxResults=MAXRESULTS)):
          snippet=video['snippet']
          title=snippet['title']
          videoid=video['id']
          stats=video['statistics']
          likes=stats['likeCount'] if 'likeCount' in stats else '0'
          dislikes=stats['dislikeCount'] if 'dislikeCount' in stats else '9000'
          relateds.append({ #TODO can probably just pass original dict
            'id':videoid,
            'channel':snippet['channelTitle'],
            'channelId':snippet['channelId'],
            'title':title,
            'description':snippet['description'],
            'lpd':float(likes)/(float(dislikes)+1),
            'likes':likes,
            'dislikes':dislikes,
            'length':video['contentDetails']['duration'],
            'image':snippet['thumbnails']['default']['url'],
            })
        relatedids=relatedids[MAXRESULTS:]
      except httplib.BadStatusLine as e: #TODO
        print('BadStatusLine wtf!! '+idscsv)
    print('Total relateds: '+str(len(relateds)))
    out=open('ytuidata.js','w')
    out.write('var ytuidata=[];\n')
    i=0
    for related in sorted(relateds,reverse=True,key=operator.itemgetter('lpd')): #output
      item='ytuidata['+str(i)+']'
      out.write(item+'=[];\n')
      for data in [
        ['likes',str(int(related['likes']))],
        ['dislikes',str(int(related['dislikes']))],
        ['channel',related['channel']],
        ['id',related['id']],
        ['duration',related['length']],
        ['title',str(int(related['lpd']))+'. '+related['title']],
        ['image',related['image']],
        ['channelId',related['channelId']],
        ['description',related['description']],
        ]:
        value=data[1]
        for substitution in [
          ['\\','\\\\"'],
          ['"','\\"'],
          ['\n','\\n'],
          ['\r',''],
          [u'\u2028','\\n'],
          ]:
          value=value.replace(substitution[0],substitution[1])
        out.write(item+'["'+data[0]+'"]="'+value+'";\n')
      i+=1
  except Exception as e:
    raise e
if len(sys.argv)>1:
  topic=sys.argv[1]
if __name__ == '__main__':
  main(sys.argv)
