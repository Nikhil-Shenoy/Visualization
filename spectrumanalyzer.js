var cf = 2700e6; //original is 1700e6
var bw = 6e6; //original is 6e6
var bins = 256; //original is 256
var saCommands = new Array("set rxfreq "+(cf-bw/2),"set rxgain 30","set rxrate "+bw, "set numbins "+bins, "rxstream");
//var get_meas_msg = window.btoa("get values 256");
var get_meas_msg = "get values 256"; //original is 256
//var get_meas_msg = window.btoa("get magnitude");
var evt = document.createEvent("Event");
evt.initEvent("saConfigExecuted",true,true); 



function SAConfigure( id, url, command  )
{ 
  if ("WebSocket" in window)
  {
     // Let us open a web socket
     //var ws = new WebSocket("ws://console.sb3.orbit-lab.org:5123", 'base64');
    var ws = new WebSocket(url, 'binary');
    ws.binaryType = "arraybuffer";
    ws.onopen = function() { ws.send(command); };
    ws.onclose = function () { document.getElementById(id).dispatchEvent(evt);};
  } 
  else 
  {
    alert("WebSocket NOT supported by your Browser!");          // The browser doesn't support WebSocket
  }
}

function SAStream(url, sa)
{ 
  if ("WebSocket" in window)
  {
           // Let us open a web socket
           //var ws = new WebSocket("ws://console.sb3.orbit-lab.org:5123", 'base64');
		   var ws = new WebSocket(url, 'binary');
		   ws.binaryType = "arraybuffer";
		   
           ws.onopen = function()
           {
               // Web Socket is connected, send data using send()
               ws.send(get_meas_msg);
          };
		  
          ws.onmessage = function (evt) 
          { 
		    //var array = window.atob(evt.data);
			if(evt.data instanceof ArrayBuffer) {
			  var array = new Uint8Array(evt.data);
			  sa.drawSpectrum(array);
	        	console.log(array);	
			alert(Channel);
			}
          };
		  
          ws.onclose = function()
          { 
           // websocket is closed.
           alert("SA Connection is closed..."); 
          };
		  return (ws);
        }
        else
        {
         // The browser doesn't support WebSocket
         alert("WebSocket NOT supported by your Browser!");
        }
}



    helephant_events = {
         "addEventListener" : function(element, eventName, eventHandler, scope)
        {
            var scopedEventHandler = scope ? function(e) { eventHandler.apply(scope, [e]); } : eventHandler;
            if(document.addEventListener)
                element.addEventListener(eventName, scopedEventHandler, false);
            else if(document.attachEvent)
                element.attachEvent("on"+eventName, scopedEventHandler);
        }
    }


 
function SpectrumAnalyzer( said, parent, configurl, spectrumurl )
{
  this.id = said;
  this.parent = parent;
  this.configurl = configurl;
  this.spectrumurl = spectrumurl;

  this.fftW = 512;
  this.fftH = 200;
  this.titleH = 30;

  this.xAxisW = 70;
  this.xTicks = 5;
  this.yAxisH = 50;
  this.yTicks = 5;
  this.xAxisH = this.yAxusH + this.fftH;
  this.yAxisW = this.xAxisW + this.fftW;
  this.borderW = 5;
  this.borderH = 5;
  this.spaceH = 15;

  var w = this.xAxisW + this.fftW + 30;
  var h = this.titleH + this.fftH + this.yAxisH;
  this.titleW = w;
	
  var currX = this.borderW;
  var currY = this.borderH; 
  this.background1 = this.getCanvas(parent, parent+'_background1',currX,currY,w,h,-10);
  this.drawSAFrame(this.background1, parent, (cf-bw/2.0)/1e6, (cf+bw/2.0)/1e6 , -100.0,-50.0);
  this.canvas1 = this.getCanvas(parent, parent+'_canvas1',currX+this.xAxisW,currY+this.titleH,this.fftW,this.fftH,10);

  // get the context from the canvas to draw on
  this.cvsStk = new CanvasStack(this.canvas1.id);
  this.bkgID = this.cvsStk.getBackgroundCanvasId();
  this.ctx = document.getElementById(this.bkgID).getContext('2d');
  this.layer1 = this.cvsStk.createLayer();
  this.ctx1 = document.getElementById(this.layer1).getContext('2d');
  

  this.cWidth = this.ctx1.canvas.clientWidth;
  this.cHeight = this.ctx1.canvas.clientHeight;
  this.binWidth = 2;
  
  // create a gradient for the fill for the SA lines
  this.gradient = this.ctx1.createLinearGradient(0,0,0,300);
  this.gradient.addColorStop(1,'#000000');
  this.gradient.addColorStop(0.75,'#ff0000');
  this.gradient.addColorStop(0.25,'#ffff00');
  this.gradient.addColorStop(0,'#ffffff');	
  // set the fill style
  this.ctx1.fillStyle=this.gradient;
  this.ctx1.strokeStyle = this.gradient;
  this.ctx1.lineWidth = this.binWidth
  
  currY += (h+this.borderH+this.spaceH);
  this.waterH = 128;
  this.waterW = this.fftW;
  h = 2 * this.borderH + this.waterH;
  this.background2 = this.getCanvas(parent, parent+'_background2',currX,currY,w,h,10);
  this.drawWAFrame(this.background2, 0, 6)
  this.canvas2 = this.getCanvas(parent, parent+'_canvas2',currX+this.xAxisW,currY,this.waterW,this.waterH,20);
  this.ctx2 = this.canvas2.getContext("2d");
  this.spHeight = this.canvas2.clientHeight;
  
  // used for color distribution
  this.hot = new chroma.ColorScale({
    colors:['#000000', '#ff0000', '#ffff00', '#ffffff'],
    positions:[0, .25, .75, 1],
    mode:'rgb',
    limits:[0, 300]
  });
  // create a temp canvas we use for copying
  this.tempCanvas = document.createElement("canvas");
  this.tempCanvas.width=this.ctx2.canvas.clientWidth;
  this.tempCanvas.height=this.ctx2.canvas.clientHeight; 
  this.tempCanvasCtx = this.tempCanvas.getContext("2d");
  
  var target = document.getElementById(this.parent);
  helephant_events.addEventListener(target,"saConfigExecuted",this.configSAHandler,this);
  this.currComm = 0;
  SAConfigure(this.parent, this.configurl, saCommands[this.currComm++]); 
}

SpectrumAnalyzer.prototype.configSAHandler = function(event)
{
  if (this.currComm < saCommands.length)
	SAConfigure(this.parent, this.configurl, saCommands[this.currComm++]);
  else {
	this.ws = SAStream(this.spectrumurl, this);
  }
}

SpectrumAnalyzer.prototype.update = function()
{
  if (this.ws != null && this.ws.readyState == 1) this.ws.send(get_meas_msg);
}

SpectrumAnalyzer.prototype.drawSAFrame = function( canvas, name, xmin, xmax, ymin, ymax  )
{
	var ctx=canvas.getContext("2d");
    var x = canvas.width / 2;
    var y = canvas.height / 2;

	ctx.fillStyle = "#cccccc"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
    ctx.fillStyle = 'black';
    ctx.font="bold 18px Arial";
    ctx.fillText(name,x,2);

	var tickL = 7;
	ctx.strokeStyle = 'black';
    var val = (xmax-xmin)/this.xTicks;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.font="12px Arial";
	var cx = this.xAxisW; var cy = this.titleH + this.fftH;
	var off = this.fftW/(this.xTicks);
	for (var i = 0, num = xmin; i < (this.xTicks+1); i++, cx += off, num += val)
	{
	  ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx,cy+tickL);
	  ctx.stroke();
	  ctx.fillText(num.toFixed(2),cx,cy+tickL+2);	
	}
	ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'black';
    ctx.font='bold 16px Arial';
	cx = this.xAxisW  + (this.yAxisW/2.0); 
	cy = this.titleH + this.fftH + this.yAxisH - 2;
    ctx.fillText("Frequency (MHz)",cx,cy);
	
	val = (ymax-ymin)/this.yTicks;
	ctx.textAlign = 'right';
	ctx.textBaseline = 'middle';
    ctx.font="12px Arial";
	cx = this.xAxisW; cy = this.titleH + this.fftH;
    off = this.fftH/this.yTicks;
    for (var i = 0, num = ymin; i < (this.yTicks+1); i++,cy -= off, num += val)
	{
	  ctx.beginPath();
      ctx.moveTo(cx-tickL,cy);
      ctx.lineTo(cx,cy);
	  ctx.stroke();
      ctx.fillText(num.toFixed(2),cx-tickL-2,cy);	
	}
	ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'black';
    ctx.font="bold 16px Arial";
	cx = 2; cy = this.titleH + (this.fftH/2.0);
	ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI/2);
    //ctx.fillText("Your Label Here", labelXposition, 0);
	ctx.fillText("dB",0,0);
    ctx.restore();
}

SpectrumAnalyzer.prototype.drawWAFrame = function( canvas, min, max )
{
	var ctx=canvas.getContext("2d");
	ctx.fillStyle = "#cccccc"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
	var ticks = 3;
    var tickL = 7;
	ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.font="12px Arial";
    var cx = this.xAxisW; var cy = this.waterH;
	var off = this.waterH/ticks;
	var val = (max-min)/ticks;
	ctx.textAlign = 'right';
	ctx.textBaseline = 'middle';
    for (var i = 0, num = max; i < (ticks+1); i++,num -= val)
	{
	  ctx.beginPath();
      ctx.moveTo(cx-tickL,cy);
      ctx.lineTo(cx,cy);
	  ctx.stroke();
      ctx.fillText(num.toFixed(2),cx-tickL-2,cy);	
      cy -= off;
	}
	ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'black';
    ctx.font="bold 16px Arial";
	cx = 2; cy =(this.waterH/2.0);
	ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI/2);
	ctx.fillText("sec",0,0);
    ctx.restore();
}

SpectrumAnalyzer.prototype.getCanvas = function(parent,id, left,top,w,h,z)
{
  canv = document.createElement('canvas');
  canv.id             = id;
  canv.style.left     = left+"px";
  canv.style.top      = top+"px";
  canv.width          = w;
  canv.height         = h;
  canv.style.zIndex   = z;
  canv.style.position = "absolute";
  document.getElementById(parent).appendChild(canv);
  return canv
}

SpectrumAnalyzer.prototype.drawGrid = function()
{
}
  
SpectrumAnalyzer.prototype.getId = function()
{
  return this.id;
}

SpectrumAnalyzer.prototype.drawSpectrum = function(array) {
  // clear the current state
  this.ctx1.clearRect(0, 0, this.cWidth, this.cHeight);
  // copy the old spectrogram
  this.tempCanvasCtx.drawImage(this.canvas2, 0, 0, this.cWidth, this.spHeight);
  // iterate over the elements from the array
  for ( var i=0,j=0; j < (array.length); i += this.binWidth, j++ ){
    var value = array[j];
	// Fisrst draw the line on the current spectrum
    this.ctx1.beginPath();
    this.ctx1.moveTo(i,this.cHeight-value);
    this.ctx1.lineTo(i,this.cHeight);
    this.ctx1.stroke();
	// Then update spectrogram by drawin the pixel with the specific color
    this.ctx2.fillStyle = this.hot.getColor(value).hex(); 
    this.ctx2.fillRect(i, 0, i+this.binWidth, 1);
  }
  // FInish with the spectrogram bu translatin the canvas by one row
  this.ctx2.translate(0, 1);
  // draw the copied image
  this.ctx2.drawImage(this.tempCanvas, 0, 0, this.cWidth, this.spHeight);
  // reset the transformation matrix
  this.ctx2.setTransform(1, 0, 0, 1, 0, 0);
}

