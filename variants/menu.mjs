// The selector is a developer page, never part of the child's game UI.
if(new URLSearchParams(location.search).get('debug')==='1'){
 const target=new URL('../debug.html',import.meta.url);
 const current=new URLSearchParams(location.search).get('game');
 if(current)target.searchParams.set('game',current);
 location.replace(target.href);
}
