#!/usr/bin/python3
import subprocess
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from oauth2client.file import Storage

def get_authenticated_service():
  flow=InstalledAppFlow.from_client_secrets_file("client_secret.json", ['https://www.googleapis.com/auth/youtube.force-ssl'])
  storage = Storage('credentials.storage')
  credentials=storage.get()
  if credentials==None:
    credentials=flow.run_local_server(
        host='localhost',
        port=8080, 
        authorization_prompt_message='Please visit this URL: {url}', 
        success_message='The auth flow is complete; you may close this window.',
        open_browser=True)
    try:
        storage.put(credentials)
    except AttributeError as e:
        pass #for some reason credentials doesn't have 
  return build('youtube', 'v3', credentials = credentials)
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
