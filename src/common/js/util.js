function getRandomInt(min,max){
return Math.floor(Math.random()*(max-min+1)+min)
}

export function shuffle(arr){
  let _arr=arr.slice()
  for(let i=0;i<_arr.length;i++){
    let j=getRandomInt(0,i);
    let t=_arr[i]
    _arr[i]=_arr[j]
    _arr[j]=t
  }
  return _arr
}
     
export function myBrowser(){
  var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
  if (userAgent.indexOf("Safari") > -1) {
    return true;
} //判断是否Safari浏览器
else return false
}
