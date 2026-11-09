/** Fit complete artwork inside the board opening, without cropping or scrolling. */
export function fitArtwork(width,height){
 return {assembly:Math.max(0,Math.min(width*.62,height)),tray:Math.max(0,Math.min(width*.28,height*2/3)),difference:Math.max(0,Math.min(width*.48,height/(.18+.82*4/3)))};
}
export function syncLayout(board){
 if(!board)return;
 const frame=board.parentElement;
 if(frame?.classList.contains('puzzle-frame')){
  const ratio=2142/349,width=Math.min(frame.clientWidth*.80,frame.clientHeight*.105*ratio),height=width/ratio;
  frame.style.setProperty('--ribbon-left',(frame.clientWidth-width)/2+'px');
  frame.style.setProperty('--ribbon-width',width+'px');
  frame.style.setProperty('--ribbon-height',height+'px');
  frame.style.setProperty('--ribbon-font',height*.44+'px');
 }
 const fit=fitArtwork(board.clientWidth,board.clientHeight);
 board.style.setProperty('--assembly-size',fit.assembly+'px');
 board.style.setProperty('--assembly-tray-width',fit.tray+'px');
 const gallery=board.querySelector('.difference-pictures');
 // Six-pixel frame on each side; fit the actual 3:4 photo, not an old
 // percentage-based card whose margins changed under the responsive styles.
 const photoWidth=gallery?Math.max(0,Math.min(gallery.clientWidth*.465,(gallery.clientHeight-12)*.75+12)):fit.difference;
 board.style.setProperty('--difference-width',photoWidth+'px');
 // The answer is square and constrained by the row's height, in every state.
 // Measuring the parent prevents a placed tile's intrinsic grid size feeding
 // back into (and enlarging) its answer container.
 for(const row of board.querySelectorAll('.quantity-row')){
  const size=Math.max(0,Math.floor(Math.min(row.clientHeight*.84,row.clientWidth*.22)));
  row.style.setProperty('--answer-size',size+'px');
 }

}

