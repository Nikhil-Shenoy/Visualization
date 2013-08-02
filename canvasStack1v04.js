/*=============================================================
  Filename: canvasStack1v04.js
  Rev: 1
  By: A.R.Collins
  Description: Utilities to create multiple transparent
  canvas elements layers suitable for animation.
  License: Released into the public domain
  latest version at
  <http://www/arc.id.au/CanvasLayers.html>

  Date   |Description                                      |By
  -------------------------------------------------------------
  30Oct09 Rev 1.00 First release                            ARC
  08Sep12 bugfix: test for emulator failed in IE9           ARC
  02Mar13 Re-write to use screen canvas as background       ARC
  =============================================================*/

  function CanvasStack(cvsID)
  {
    // test if excanvas emulator is being used
    this.excanvas = (typeof G_vmlCanvasManager != 'undefined');

    this.overlays = [];  // a linked list of offscreen canvases by key,value
    this.ovlyNumber = 0;  // counter to generate unique IDs
    this.bkgCvsId = cvsID;
    this.bkgCvs = document.getElementById(this.bkgCvsId);
    var stkId = this.bkgCvsId+'_stk';
    // create a holder div for the stack of canvases
    var stackHTML = "<div id='"+stkId+"' style='position:absolute'></div>";
    this.bkgCvs.insertAdjacentHTML('afterend', stackHTML);
    // make it the same size as the background canvas
    this.stack = document.getElementById(stkId);
    this.stack.style.backgroundColor = "transparent";
    this.stack.style.left = this.bkgCvs.offsetLeft+'px';
    this.stack.style.top = this.bkgCvs.offsetTop+'px';
    this.stack.style.width = this.bkgCvs.offsetWidth+'px';
    this.stack.style.height = this.bkgCvs.offsetHeight+'px';
  }

  CanvasStack.prototype.getBackgroundCanvasId = function()
  {
    return this.bkgCvsId;
  }

  CanvasStack.prototype.getBackgroundCanvas = function()
  {
    return this.bkgCvs;
  }

  CanvasStack.prototype.getOverlayCanvas = function(ovlId)
  {
    for (var i=0; i<this.overlays.length; i++)
    {
      if (this.overlays[i].id == ovlId)
        return this.overlays[i].node;
    }
    return null;
  }

  CanvasStack.prototype.createLayer = function()
  {
    var newCvs = document.createElement('canvas');
    var ovlId = this.bkgCvsId+"_ovl_"+this.ovlyNumber;

    this.ovlyNumber++;   // increment the count to make unique ids
    newCvs.setAttribute('id', ovlId);
    newCvs.setAttribute('width', this.bkgCvs.offsetWidth);
    newCvs.setAttribute('height', this.bkgCvs.offsetHeight);
    newCvs.style.backgroundColor = "transparent";
    newCvs.style.position = "absolute";
    newCvs.style.left = "0px";
    newCvs.style.top = "0px";
    newCvs.style.width = this.bkgCvs.offsetWidth+'px';
    newCvs.style.height = this.bkgCvs.offsetHeight+'px';

    this.stack.appendChild(newCvs);

    // now make sure this dynamic canvas is recognised by the excanvas emulator
    if (this.excanvas)
      G_vmlCanvasManager.initElement(newCvs);

    // save the ID in a global array to facilitate removal
    this.overlays.push(ovlId);

    return ovlId;    // return the new canavs id for call to getGraphicsContext
  }

  CanvasStack.prototype.deleteLayer = function(ovlyId)
  {
    var idx = -1;
    for (var i=0; i<this.overlays.length; i++)
    {
      if (this.overlays[i] == ovlyId)
      {
        idx = i;
        break;
      }
    }
    if (idx == -1)
    {
      alert("overlay not found");
      return;
    }
    var ovlNode = document.getElementById(ovlyId);
    if (!ovlNode)       // there is a id stored but no actual canvas
      alert("overlay node not found");
    else
      this.stack.removeChild(ovlNode);
    // now delete _overlay array element
    this.overlays.splice(idx,1);       // delete the id
  }

  CanvasStack.prototype.deleteAllLayers = function()
  {
    var ovlNode;
    for (var i=this.overlays.length-1; i>=0; i--)
    {
      ovlNode = document.getElementById(this.overlays[i]);
      if (ovlNode)
        this.stack.removeChild(ovlNode);
      // now delete _overlay array element
      this.overlays.splice(i,1);       // delete the orphan
    }
  }


