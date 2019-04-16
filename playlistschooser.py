#!/usr/bin/python3
import subprocess
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

DEBUG=False
MAXRESULTS=50

def pages(service,request,follow=True): #TODO return items
  i=0
  while request:
    try:
      response=request.execute()
    except Exception as e:
      print(e)
      continue
    for item in response['items']:
      yield item
    if not follow:
      return
    request=service.list_next(request,response)

playlistsservice=service.playlists()
myplaylists=[]
for pl in pages(playlistsservice,playlistsservice.list(part='id,snippet',maxResults=MAXRESULTS,mine=True)):
    myplaylists.append(pl)
playlists=sorted(myplaylists,key=lambda x:x['snippet']['title'].lower())
command=['python3','ytplaylistexpander.py']
while len(playlists)>0:
    page=playlists[:9]
    playlists=playlists[9:]
    i=1
    for pl in page:
        print(str(i)+' - '+pl['snippet']['title'])
        i+=1
    print('')
    for i in input('Type all the playlists you want to include in this search. Press ENTER for the next page. '):
        command.append(page[int(i)-1]['id'])
subprocess.call(command)
