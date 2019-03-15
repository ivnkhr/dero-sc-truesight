console.log('DERO Truesight Availiable');
variable_state = {};

function getLatestState(){
  try{
    chrome.runtime.sendMessage({action: 'getStatus'}, function(response) {
      try{
        var child = document.getElementsByClassName('truesight-noscript')[0];
        child.parentNode.removeChild(child);
      }catch(err){
        //err
      }
      if( !Object.is(variable_state, response) ){
        variable_state = response;
        try{
          if(variable_state.wallet==null){
            document.getElementsByClassName('truesight-wallet')[0].value = 'plugin locked';
          }else{
            document.getElementsByClassName('truesight-wallet')[0].value = response.wallet;
          }
          if(variable_state.daemon==null){
            document.getElementsByClassName('truesight-daemon')[0].value = 'plugin locked';
          }else{
            document.getElementsByClassName('truesight-daemon')[0].value = response.daemon;
          }
        }catch(err){
          //err
        }
      }
    });
  }catch(err){
    //err
  }
}

document.addEventListener('DOMContentLoaded', function() {
  getLatestState();

  setInterval(()=>{   
    getLatestState();
  }, 3000);
}, false);