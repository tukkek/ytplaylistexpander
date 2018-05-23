var DURATIONFIELDSFLAGS=['s','m','h'];
var DURATIONFIELDS=[];
var MAXVIDEOS=15000; //baseline is loading in 30 second

var totalduration=0;
var descriptions=[];
var images=[];

function parsefilter(id){
  return parseInt(document.querySelector('#'+id).value);
}
function retrieveattribute(element,name){
  var a=element.attributes[name];
  return a&&a.value;
}
function integerattribute(element,attribute){
  return parseInt(retrieveattribute(element,attribute));
}
function filter(){
  var videos=document.querySelector('#videos');
  var videosparent=videos.parentNode;
  videosparent.removeChild(videos); //prevents reflow
  var links=videos.querySelectorAll('.video');
  for (var i=0;i<links.length;i++){
    var link=links[i];
    var duration=parseFloat(retrieveattribute(link,'duration'))/60;
    var dislikes=integerattribute(link,'dislikes');
    var likes=integerattribute(link,'likes');
    link.style['display']=
      parsefilter('min')<=duration&&duration<=parsefilter('max')&&
      parsefilter('mindislikes')<=dislikes&&dislikes<=parsefilter('maxdislikes')&&
      parsefilter('minlikes')<=likes&&likes<=parsefilter('maxlikes')
      ?'table-row':'none';
  }
  videosparent.appendChild(videos);
}
function getuploader(video){
  return video.getAttribute('user');
}
function hideuser(user,me){
  while(!me.classList.contains('video')){
    me=me.parentNode;
  }
  var videos=document.querySelectorAll('.video');
  var i=0;
  for(;i<videos.length;i++){
    if(me==videos[i]){
      break;
    }
  }
  var next=false;
  for(;i<videos.length;i++){
    next=videos[i];
    if(getuploader(next)!=getuploader(me)){
      break;
    }
  }
  var lines=document.querySelectorAll('.video[user='+user+']');
  for (var i=0;i<lines.length;i++){
    var line=lines[i];
    line.parentNode.removeChild(line);    
  }
  next.scrollIntoView();
}
function showdescription(i){
  alert(descriptions[i]);
}
function changeattribute(node,attribute,value){
  node.attributes[attribute].value=value;
}
function clicktitle(title,item){
  var parent=title.parentNode;
  changeattribute(parent,'collapse','no');
  changeattribute(title,'onclick','');
  changeattribute(parent.querySelector('img'),'src',images[item]);
  return false;
}
function expandall(){
  var videos=document.querySelectorAll('.video');
  for (var i=0;i<videos.length;i++) {
    var video=videos[i];
    if (video.attributes.collapse.value=='yes'){
      video.querySelector('a').click();
    }
  }
}
function createElement(tag){
  return document.createElement(tag);
}
function createFullElement(tag,parent,content){
  var element=createElement(tag);
  parent.appendChild(element);
  element.outerHTML=content;
  return element;
}

for (var i=0;i<DURATIONFIELDSFLAGS.length;i++){
  var flag=DURATIONFIELDSFLAGS[i];
  DURATIONFIELDS[flag]=Math.pow(60,i);
}

if(!window.ytuilinkprefix){
  window.ytuilinkprefix='http://www.youtube.com/watch?v=';
}
var originallength=ytuidata.length;
var removed=originallength-MAXVIDEOS;
var html=[];
if (removed>0){
  ytuidata.splice(removed,removed);
  html.push('Removed last '+removed+' videos ('+Math.round(100*removed/originallength)+'% total) to ensure the '+MAXVIDEOS+' limit.<br/><br/>');
}
html.push('Show videos between:\
  <ul>\
    <li><input value="0"\ id="min"/> and \
    <input value="36000" id="max"/> minutes</li>\
    <li><input value="1" id="minlikes"/> and \
    <input value="99999999" id="maxlikes"/> likes</li>\
    <li><input value="0" id="mindislikes"/> and \
    <input value="99999999" id="maxdislikes"/> dislikes</li>\
  </ul>\
  <button onclick="filter()">Filter</button>\
  <button onclick="expandall()">Expand all</button><br/>');
html.push('<span id="videos">');
for (var i=0;i<ytuidata.length;i++){
  var item=ytuidata[i];
  var channelid=item['channelId'];
  var duration=0;
  var descritiveduration=item['duration'].substr(2);
  var isoduration=descritiveduration.toLowerCase();
  var isodurationdefield='';
  for (var j=0;j<isoduration.length;j++){
    var character=isoduration[j];
    if (isNaN(character)){
      duration+=parseInt(isodurationdefield)*DURATIONFIELDS[character];
      isodurationdefield='';
    } else {
      isodurationdefield+=character;
    }
  }
  totalduration+=duration;
  var stats=item['stats'];
  if(stats){
    stats+=' ';
  }else{
    stats='';
  }
  var videoinfo=stats+'likes="'+item['likes']+'" dislikes="'+item['dislikes']+'"'+' duration="';
  descriptions[i]=item.description;
  images[i]=item['image'];
  html.push(
    '<div '+videoinfo+duration+'" class="video" user="'+channelid+'" collapse="yes">'+
      '<a href="'+
      ytuilinkprefix+
      item['id']+
      '" target="_blank" onclick="return clicktitle(this,'+i+');" title=\''+
      videoinfo+descritiveduration+
      '"\'>'+
        '<img src=""/>'+
        '<div class="title">'+item['title']+'</div>'+
      '</a>'+
      '<br/>'+
      '<div class="actions">'+
        '<button onclick="hideuser(\''+channelid+'\',this)">Hide user</button>'+
        '<button onclick="showdescription('+i+')">Description</button>'+
        '<br/>'+
        '<a href="http://www.youtube.com/channel/'+
        channelid+
        '/videos?view=1&flow=grid" target="blank">'+
          item['channel']+
        '</a>'+
      '</div>'+
    '</div>');
}
html.push('</span>');
document.body.innerHTML+=html.join('');
document.body.onload=filter;
//collect garbage
ytuidata=false; 
html=false;
