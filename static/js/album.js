(() => {
 const stage = document.querySelector('.album-stage');
 const photos = [...stage.querySelectorAll('.album-photo')];
 const picker = document.querySelector('.album-picker');
 const buttons = [];
 let current = 0;
 photos.forEach((photo,index) => {
  const button = document.createElement('button');
  button.type='button'; button.setAttribute('aria-label',`Show photo ${index+1}: ${photo.dataset.caption}`);
  const image = document.createElement('img'); image.src=photo.querySelector('img').src; image.alt=''; image.loading='lazy';
  button.append(image);button.addEventListener('click',() => {current=index;render();});picker.append(button);buttons.push(button);
 });
 function render() {
  photos.forEach((photo,index) => {
   const position = index===current?'active':index===(current+photos.length-1)%photos.length?'before':index===(current+1)%photos.length?'after':'hidden';
   photo.dataset.position=position;photo.inert=position!=='active';photo.setAttribute('aria-hidden',String(position!=='active'));
   const image=photo.querySelector('img');if(position!=='hidden')image.loading='eager';
   buttons[index].setAttribute('aria-pressed',String(index===current));
  });
  document.querySelector('#album-count').textContent=`${String(current+1).padStart(2,'0')} / ${photos.length}`;
  document.querySelector('#album-caption').textContent=photos[current].dataset.caption;
 }
 function move(direction){current=(current+direction+photos.length)%photos.length;render();}
 document.querySelector('#album-prev').addEventListener('click',()=>move(-1));
 document.querySelector('#album-next').addEventListener('click',()=>move(1));
 stage.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}
 });
 let touch=null;
 stage.addEventListener('touchstart',event=>{touch=[event.touches[0].clientX,event.touches[0].clientY];},{passive:true});
 stage.addEventListener('touchend',event=>{if(!touch)return;const dx=event.changedTouches[0].clientX-touch[0];const dy=event.changedTouches[0].clientY-touch[1];if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1);touch=null;},{passive:true});
 stage.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
 render();
})();
