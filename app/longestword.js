function LongestWord(sen) {

  var inarr = sen.split(" "),
      inlen = inarr.length,
      max = 0,
      longestWord ="";

  for(var i=0; i < inlen; i ++){
      var max = Math.max(max, inarr[i].length);
    if(inarr[i].length === max){
       longestWord = inarr[i];
    }
  }

  // code goes here
  return longestWord;

}