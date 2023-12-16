javascript:(() => {
  const buttonPressed = (b) => typeof b == 'object' ? b.pressed : b == 1.0;
  
  simulation.mouseDistance = 120;
  simulation.mouseAngle = 0;
  simulation.mousePos = { x: 0, y: 0 }
  simulation.customLook = false;
  
  const oldEndDraft = powerUps.endDraft;
  powerUps.endDraft = (type, isCancelled = false) => {
    selectedElement = null;
    oldEndDraft(type, isCancelled);
  }

  simulation.camera = () => {
    if (simulation.customLook) {
      simulation.mouse.x = simulation.mousePos.x;
      simulation.mouse.y = simulation.mousePos.y;
    } else {
      var mCanvasPos = {
        x: ((m.pos.x + m.transX - canvas.width2) /  simulation.edgeZoomOutSmooth) * simulation.zoom + canvas.width2,
        y: simulation.mouse.y = ((m.pos.y + m.transY - canvas.height2) /  simulation.edgeZoomOutSmooth) * simulation.zoom + canvas.height2
      }

      simulation.mouse.x = mCanvasPos.x + Math.cos(simulation.mouseAngle) * simulation.mouseDistance;
      simulation.mouse.y = mCanvasPos.y + Math.sin(simulation.mouseAngle) * simulation.mouseDistance;
    }
    
    const dx = simulation.mouse.x / window.innerWidth - 0.5;
    const dy = simulation.mouse.y / window.innerHeight - 0.5;
    const d = Math.max(dx * dx, dy * dy)
    simulation.edgeZoomOutSmooth = (1 + 4 * d * d) * 0.04 + simulation.edgeZoomOutSmooth * 0.96

    ctx.save();
    ctx.translate(canvas.width2, canvas.height2);
    ctx.scale(simulation.zoom / simulation.edgeZoomOutSmooth, simulation.zoom / simulation.edgeZoomOutSmooth);
    ctx.translate(-canvas.width2 + m.transX, -canvas.height2 + m.transY);
    simulation.mouseInGame.x = (simulation.mouse.x - canvas.width2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.width2 - m.transX;
    simulation.mouseInGame.y = (simulation.mouse.y - canvas.height2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.height2 - m.transY;
  }
  
  function setCrosshair() {
    simulation.customLook = false;
    var mCanvasPos = {
      x: ((m.pos.x + m.transX - canvas.width2) /  simulation.edgeZoomOutSmooth) * simulation.zoom + canvas.width2,
      y: simulation.mouse.y = ((m.pos.y + m.transY - canvas.height2) /  simulation.edgeZoomOutSmooth) * simulation.zoom + canvas.height2
    }

    simulation.mouse.x = mCanvasPos.x + Math.cos(simulation.mouseAngle) * simulation.mouseDistance;
    simulation.mouse.y = mCanvasPos.y + Math.sin(simulation.mouseAngle) * simulation.mouseDistance;
    simulation.mousePos = { x: simulation.mouse.x, y: simulation.mouse.y };
    
    simulation.mouseInGame.x = (simulation.mouse.x - canvas.width2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.width2 - m.transX;
    simulation.mouseInGame.y = (simulation.mouse.y - canvas.height2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.height2 - m.transY;
  }
  
  function setCrosshairPoint() {
    simulation.customLook = true;
    simulation.mouse.x = simulation.mousePos.x;
    simulation.mouse.y = simulation.mousePos.y;
    
    simulation.mouseInGame.x = (simulation.mouse.x - canvas.width2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.width2 - m.transX;
    simulation.mouseInGame.y = (simulation.mouse.y - canvas.height2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.height2 - m.transY;
  }

  window.addEventListener("gamepadconnected", (e) => {
    console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}. ${e.gamepad.buttons.length} buttons, ${e.gamepad.axes.length} axes.`)
    requestAnimationFrame(loop);
  });

  var lastInputs = [];
  var crouchToggled = false;
  var freeLook = false;
  var selectedElement;
  var jumpCancel = false;
  var crouchCancel = false;
  function loop() {
    const gpInputs = [];
    const gamepad = navigator.getGamepads()[0];
    
    // buttons
    for (var i = 0; i < gamepad.buttons.length; i++) if (buttonPressed(gamepad.buttons[i])) gpInputs.push(i);
    if (simulation.onTitlePage) if (gpInputs.includes(0) && !lastInputs.includes(0)) simulation.startGame();
    else if (simulation.isChoosing) {
      if (selectedElement == null) selectedElement = document.getElementsByClassName('choose-grid-module')[0]
      selectedElement.style.border = '4px solid #000000';
      var row;
      var column;
      if (selectedElement.className.split(' ')[0] == 'choose-grid-module') {
        row = [].slice.call(document.getElementsByClassName('choose-grid-module')).filter(a => a.getBoundingClientRect().y == selectedElement.getBoundingClientRect().y);
        column = [].slice.call(document.getElementsByClassName('choose-grid-module')).filter(a => a.getBoundingClientRect().x == selectedElement.getBoundingClientRect().x);
      } else if (selectedElement.className.split(' ')[0] == 'research-card') {
        row = [selectedElement, document.getElementsByClassName('cancel-card')[0]]
        var firstRow = [].slice.call(document.getElementsByClassName('choose-grid-module')).filter(a => a.getBoundingClientRect().y == document.getElementsByClassName('choose-grid-module')[0].getBoundingClientRect().y);
        column = firstRow.length < 3 ? [selectedElement].concat([].slice.call(document.getElementsByClassName('choose-grid-module')).filter(a => a.getBoundingClientRect().x == document.getElementsByClassName('choose-grid-module')[0].getBoundingClientRect().x)) : [selectedElement].concat([].slice.call(document.getElementsByClassName('choose-grid-module')).filter(a => a.getBoundingClientRect().x == firstRow[1].getBoundingClientRect().x));
      } else if (selectedElement.className.split(' ')[0] == 'cancel-card') {
        row = (document.getElementsByClassName('research-card').length > 0 ? [ document.getElementsByClassName('research-card')[0] ] : []).concat([selectedElement]);
        var firstRow = [].slice.call(document.getElementsByClassName('choose-grid-module')).filter(a => a.getBoundingClientRect().y == document.getElementsByClassName('choose-grid-module')[0].getBoundingClientRect().y);
        column = [selectedElement].concat([].slice.call(document.getElementsByClassName('choose-grid-module')).filter(a => a.getBoundingClientRect().x == firstRow[firstRow.length - 1].getBoundingClientRect().x));
      } else console.log('Error with selected element:', selectedElement);
      
      selectedElement.selectedElement = true;
      var selectedRowIndex = 0;
      for (; selectedRowIndex < row.length && !row[selectedRowIndex].selectedElement; selectedRowIndex++) {}
      var selectedColumnIndex = 0;
      for (; selectedColumnIndex < column.length && !column[selectedColumnIndex].selectedElement; selectedColumnIndex++) {}
      
      if (selectedElement.className.split(' ')[0] == 'choose-grid-module') {
        if (selectedRowIndex == 0) {
          column = [document.getElementsByClassName('research-card')[0]].concat(column);
          selectedColumnIndex++;
        }
        if (selectedRowIndex == 1 && row.length == 3) {
          column = [document.getElementsByClassName('research-card')[0]].concat(column);
          selectedColumnIndex++;
        }
        if (selectedRowIndex == row.length - 1) {
          column = [document.getElementsByClassName('cancel-card')[0]].concat(column);
          selectedColumnIndex++;
        }
      }
      
      if (gpInputs.includes(0) && !lastInputs.includes(0)) {
        jumpCancel = true;
        selectedElement.onclick();
      }
      if (gpInputs.includes(1) && !lastInputs.includes(1)) {
        crouchCancel = true;
        document.getElementsByClassName('cancel-card')[0].onclick();
      }
      
      if (gpInputs.includes(12) && !lastInputs.includes(12)) {
        selectedElement.selectedElement = false;
      	selectedElement.style.border = '';
        
        if (selectedColumnIndex == 0) selectedElement = column[column.length - 1];
        else selectedElement = column[selectedColumnIndex - 1];
      }
      if (gpInputs.includes(13) && !lastInputs.includes(13)) {
        selectedElement.selectedElement = false;
      	selectedElement.style.border = '';
        
        if (selectedColumnIndex == column.length - 1) selectedElement = column[0];
        else selectedElement = column[selectedColumnIndex + 1];
      }
      if (gpInputs.includes(14) && !lastInputs.includes(14)) {
        selectedElement.selectedElement = false;
      	selectedElement.style.border = '';
        
        if (selectedRowIndex == 0) selectedElement = row[row.length - 1];
        else selectedElement = row[selectedRowIndex - 1];
      }
      if (gpInputs.includes(15) && !lastInputs.includes(15)) {
        selectedElement.selectedElement = false;
      	selectedElement.style.border = '';
        
        if (selectedRowIndex == row.length - 1) selectedElement = row[0];
        else selectedElement = row[selectedRowIndex + 1];
      }
      
      if (selectedElement != null) {
        if (selectedElement.getBoundingClientRect().bottom > window.innerHeight) document.getElementById('choose-grid').scroll(0, document.getElementById('choose-grid').scrollTop + selectedElement.getBoundingClientRect().bottom - window.innerHeight)
        if (selectedElement.getBoundingClientRect().top < 0) document.getElementById('choose-grid').scroll(0, document.getElementById('choose-grid').scrollTop + selectedElement.getBoundingClientRect().top)
      }
    } else if (simulation.paused) {
      if (gpInputs.includes(1) || (gpInputs.includes(9) && !lastInputs.includes(9))) {
        build.unPauseGrid();
        simulation.paused = false;
        document.body.style.cursor = "none";
        requestAnimationFrame(cycle);
      }
    } else {
      if (!jumpCancel) input.up = gpInputs.includes(0);
      if (!gpInputs.includes(0)) jumpCancel = false;
      if (!crouchCancel) {
        if (m.onGround) {
          if (!crouchToggled && input.down) input.down = false;
          if (gpInputs.includes(1) && !lastInputs.includes(1)) {
            input.down = !input.down;
            crouchToggled = !crouchToggled;
          }
        } else {
          crouchToggled = false;
          input.down = gpInputs.includes(1);
        }
      }
      if (!gpInputs.includes(1)) crouchCancel = false;
      if (gpInputs.includes(4) && !lastInputs.includes(4)) simulation.previousGun();
      if (gpInputs.includes(5) && !lastInputs.includes(5)) simulation.nextGun();
      input.field = gpInputs.includes(6);
      input.fire = gpInputs.includes(7);
      if (gpInputs.includes(8) && !lastInputs.includes(8)) freeLook = !freeLook;
      if (gpInputs.includes(9) && !lastInputs.includes(9)) {
        if (!simulation.isChoosing && m.alive) {
          if (!tech.isNoDraftPause) {
            simulation.paused = true;
            build.pauseGrid();
            document.body.style.cursor = "auto";

            if (tech.isPauseSwitchField || simulation.testing) {
              document.getElementById("pause-field").addEventListener("click", () => {
                const energy = m.energy;
                if (m.fieldMode === 4 && simulation.molecularMode < 3) {
                  simulation.molecularMode++;
                  m.fieldUpgrades[4].description = m.fieldUpgrades[4].setDescription();
                } else {
                  m.setField((m.fieldMode === m.fieldUpgrades.length - 1) ? 0 : m.fieldMode + 1);
                  if (m.fieldMode === 4) {
                    simulation.molecularMode = 0;
                    m.fieldUpgrades[4].description = m.fieldUpgrades[4].setDescription();
                  }
                }
                m.energy = energy;
                document.getElementById("pause-field").innerHTML = `<div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[m.fieldMode].name}</div> ${m.fieldUpgrades[m.fieldMode].description}`;
              });
            }
          }
        }
      }
    }
    
    // joysticks
    if (freeLook) {
      if (Math.abs(gamepad.axes[2]) > 0.3) simulation.mousePos.x += gamepad.axes[2] * 5;
      if (Math.abs(gamepad.axes[3]) > 0.3) simulation.mousePos.y += gamepad.axes[3] * 5;
      setCrosshairPoint();
    } else {
      simulation.mouseDistance = Math.sqrt(gamepad.axes[2]**2 + gamepad.axes[3]**2) * 300;
      if (simulation.mouseDistance < 120) simulation.mouseDistance = 120;
      else simulation.mouseAngle = Math.atan2(gamepad.axes[3], gamepad.axes[2]);
      setCrosshair();
    }
    
    const moveDistance = Math.sqrt(gamepad.axes[1]**2 + gamepad.axes[0]**2);
    const moveAngle = Math.atan2(gamepad.axes[1], gamepad.axes[0]);
    if (moveDistance > 0.4) {
      input.right = moveAngle > -Math.PI * 2/5 && moveAngle < Math.PI * 2/5;
      input.left = moveAngle > Math.PI * 3/5 || moveAngle < -Math.PI * 3/5;
      if (moveAngle > Math.PI / 4 && moveAngle < Math.PI * 3/4 && moveDistance > 0.7) input.down = true;
      else if (!crouchToggled) input.down = false
      if (moveAngle > -Math.PI * 3/4 && moveAngle < -Math.PI / 4 && moveDistance > 0.7) input.up = true;
    } else {
      input.right = input.left = false;
      if (!crouchToggled) input.down = false;
    }

    lastInputs = gpInputs;
    requestAnimationFrame(loop);
  }
})();
