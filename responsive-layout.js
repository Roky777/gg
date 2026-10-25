/** Fit complete artwork inside the board opening, without cropping or scrolling. */
export function fitArtwork(width,height){
 return {assembly:Math.max(0,Math.min(width*.62,height)),tray:Math.max(0,Math.min(width*.28,height*2/3)),difference:Math.max(0,Math.min(width*.48,height/(.18+.82*4/3)))};
}
export function syncLayout(board){
 if(!board)return;const fit=fitArtwork(board.clientWidth,board.clientHeight);
 board.style.setProperty('--assembly-size',fit.assembly+'px');
 board.style.setProperty('--assembly-tray-width',fit.tray+'px');
 board.style.setProperty('--difference-width',fit.difference+'px');
}
