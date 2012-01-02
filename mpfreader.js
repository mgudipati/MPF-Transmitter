var net = require('net'),
    events = require('events'),
    mpf = require('./mpf');


var server = net.createServer(function (stream) {
  // event emitter
  var eventEmitter = new events.EventEmitter();

  // window size
  var windowsize = 7;
  
  // emit an event when a new packet arrives from a client
  eventEmitter.addListener("NewMPFPacket", function(buf) {
    var mpfmsg = mpf.parse(buf);
    console.log(mpfmsg);  
    
    if (--windowsize == 0) {
      // send ack
      var seqno = mpfmsg.SeqNo;
      if (seqno) {
        buf = mpf.createACKPacket(seqno);
        console.log("sending ack packet => " + buf.toString('hex'));
        stream.write(buf);
        windowsize = 7;
      }
    }
  });

  // mpf packet state
  var laststate = mpf.MPF_FRAME_START,
      lastarr = new Array();
  
  stream.addListener("data", function (chunk) {
    console.log("received => " + chunk.toString('hex'));
    laststate = mpf.deserialize(chunk, laststate, lastarr, function (mpfarr) {
      eventEmitter.emit("NewMPFPacket", mpfarr);
    });    
  });
}).listen(2000, "127.0.0.1", function() {
    console.log("waiting for connections on port 2000...");
  });
  
