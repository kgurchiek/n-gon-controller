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

var started = false;
var lastInputs = [];
var crouchToggled = false;
var freeLook = false;
var selectedElement;
var jumpCancel = false;
var crouchCancel = false;
var wasChoosing = false;

window.addEventListener('gamepadconnected', (e) => {
  console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}. ${e.gamepad.buttons.length} buttons, ${e.gamepad.axes.length} axes.`);
  if (!started) setInterval(loop);
  started = true;
});
function loop() {
  const gpInputs = [];
  const gamepad = navigator.getGamepads()[0];
  
  // buttons
  for (var i = 0; i < gamepad.buttons.length; i++) if (buttonPressed(gamepad.buttons[i])) gpInputs.push(i);
  if (simulation.onTitlePage) {
    if (gpInputs.includes(0) && !lastInputs.includes(0)) {
      simulation.startGame();
      jumpCancel = true;
    }
  } else if (m.alive) {
    if (simulation.isChoosing) {
      const choices = Array.from(document.getElementsByClassName('choose-grid-module')).filter(a => !a.className.includes('entanglement'));
      const cancel = document.getElementsByClassName('cancel-card')[0];
      const research = document.getElementsByClassName('research-card')[0];
      const entanglement = document.getElementsByClassName('entanglement')[0]
      const firstRow = choices.filter(a => a.getBoundingClientRect().y == choices[0].getBoundingClientRect().y);
      const constraints = Array.from(Array.from(document.getElementsByClassName('right-column')).filter(a => a.children[0].id.startsWith('constraint'))[0]?.children || []);

      if (selectedElement == null || !wasChoosing) selectedElement = constraints[0] || choices[0];
      selectedElement.style.border = '4px solid #000000';
      var row;
      var column;
      if (constraints.length > 0) {
        row = [selectedElement];
        column = constraints.concat(document.getElementById('choose-difficulty'));
      } else if (selectedElement.className.split(' ').includes('cancel-card')) {
        row = (research == null ? entanglement == null ? [] : [ entanglement ] : [ research ]).concat([selectedElement]);
        column = [selectedElement].concat(choices.filter(a => a.getBoundingClientRect().x == firstRow[firstRow.length - 1].getBoundingClientRect().x));
      } else if (selectedElement.className.split(' ').includes('research-card')) {
        row = [selectedElement, cancel];
        column = firstRow.length < 3 ? [selectedElement].concat(choices.filter(a => a.getBoundingClientRect().x == choices[0].getBoundingClientRect().x)) : [selectedElement].concat(choices.filter(a => a.getBoundingClientRect().x == firstRow[1].getBoundingClientRect().x));
      } else if (selectedElement.className.split(' ').includes('entanglement')) {
        row = [selectedElement, cancel];
        column = firstRow.length < 3 ? [selectedElement].concat(choices.filter(a => a.getBoundingClientRect().x == choices[firstRow.length - 1].getBoundingClientRect().x)) : [selectedElement].concat(choices.filter(a => a.getBoundingClientRect().x == firstRow[1].getBoundingClientRect().x));
      } else if (selectedElement.className.split(' ').includes('choose-grid-module')) {
        row = choices.filter(a => a.getBoundingClientRect().y == selectedElement.getBoundingClientRect().y);
        column = choices.filter(a => a.getBoundingClientRect().x == selectedElement.getBoundingClientRect().x);
      }  else {
        row = [selectedElement];
        column = [selectedElement];
      }
      
      selectedElement.isSelected = true;
      var selectedRowIndex = 0;
      for (; selectedRowIndex < row.length && !row[selectedRowIndex].isSelected; selectedRowIndex++) {}
      var selectedColumnIndex = 0;
      for (; selectedColumnIndex < column.length && !column[selectedColumnIndex].isSelected; selectedColumnIndex++) {}

      console.log(selectedElement.className.split(' ').includes('choose-grid-module'), research != null, selectedRowIndex, firstRow.length)
      if (selectedElement.className.split(' ').includes('choose-grid-module') && research != null) {
        if (selectedRowIndex < firstRow.length - 1 || firstRow.length == 1) {
          column = [research].concat(column);
          selectedColumnIndex++;
        }
      }
      if ((selectedElement.className.split(' ').includes('choose-grid-module')) && !(selectedElement.className.split(' ').includes('entanglement')) && entanglement != null) {
        if (firstRow.length < 3 || (firstRow.length == 3 && selectedRowIndex < 2)) {
          column = [entanglement].concat(column);
          selectedColumnIndex++;
        }
      }
      if (cancel != null && selectedRowIndex == firstRow.length - 1 && ((entanglement == null && research == null) || (firstRow.length == 2 && entanglement == null) || firstRow.length == 3)) {
        column = [cancel].concat(column);
        selectedColumnIndex++;
      }

      if (gpInputs.includes(0) && !lastInputs.includes(0)) {
        jumpCancel = true;
        (selectedElement.onclick || selectedElement.click || (() => {})).call(selectedElement);
      }
      if (gpInputs.includes(1) && !lastInputs.includes(1)) {
        crouchCancel = true;
        let cancel = document.getElementsByClassName('cancel-card')[0];
        let exit = document.getElementById('exit');
        let confirm = document.getElementById('choose-difficulty');
        if (cancel?.onclick) cancel.onclick();
        else if (exit?.click) exit.click();
        else if (confirm?.click) confirm.click();
      }

      if (gpInputs.includes(12) && !lastInputs.includes(12)) {
        selectedElement.isSelected = false;
        selectedElement.style.border = '';

        console.log(selectedColumnIndex, column)
        if (selectedColumnIndex == 0) selectedElement = column[column.length - 1];
        else selectedElement = column[selectedColumnIndex - 1];

        if (selectedElement.getBoundingClientRect().bottom > window.innerHeight) document.getElementById('choose-grid').scroll(0, document.getElementById('choose-grid').scrollTop + selectedElement.getBoundingClientRect().bottom - window.innerHeight)
        if (selectedElement.getBoundingClientRect().top < 0) document.getElementById('choose-grid').scroll(0, document.getElementById('choose-grid').scrollTop + selectedElement.getBoundingClientRect().top)
      }
      if (gpInputs.includes(13) && !lastInputs.includes(13)) {
        selectedElement.isSelected = false;
        selectedElement.style.border = '';

        if (selectedColumnIndex == column.length - 1) selectedElement = column[0];
        else selectedElement = column[selectedColumnIndex + 1];

        if (selectedElement.getBoundingClientRect().bottom > window.innerHeight) document.getElementById('choose-grid').scroll(0, document.getElementById('choose-grid').scrollTop + selectedElement.getBoundingClientRect().bottom - window.innerHeight)
        if (selectedElement.getBoundingClientRect().top < 0) document.getElementById('choose-grid').scroll(0, document.getElementById('choose-grid').scrollTop + selectedElement.getBoundingClientRect().top)
      }
      if (gpInputs.includes(14) && !lastInputs.includes(14)) {
        selectedElement.isSelected = false;
        selectedElement.style.border = '';

        if (selectedRowIndex == 0) selectedElement = row[row.length - 1];
        else selectedElement = row[selectedRowIndex - 1];
      }
      if (gpInputs.includes(15) && !lastInputs.includes(15)) {
        selectedElement.isSelected = false;
        selectedElement.style.border = '';

        if (selectedRowIndex == row.length - 1) selectedElement = row[0];
        else selectedElement = row[selectedRowIndex + 1];
      }


      var joystickDistance = Math.sqrt(gamepad.axes[2]**2 + gamepad.axes[3]**2);
      if (selectedElement != null && joystickDistance > 0.4) {
          document.getElementById('choose-grid').scroll(0, document.getElementById('choose-grid').scrollTop + gamepad.axes[3] * 5);
      }
    } else if (simulation.paused) {
      const techCards = [].slice.call(document.getElementsByClassName('pause-grid-module card-background')).filter(a => a.id.substring(a.id.length - 4) == 'tech');
      if (selectedElement == null) selectedElement = document.getElementById('pause-field');
      if (selectedElement != null) selectedElement.style.border = '4px solid #000000';

      if (selectedElement.id.includes('field')) {
        if ((gpInputs.includes(14) && !lastInputs.includes(14)) || (gpInputs.includes(15) && !lastInputs.includes(15))) {
          selectedElement.style.border = '';
          selectedElement = techCards[0]
        }
      } else {
        selectedElement.isSelected = true;
        var selectedIndex = 0;
        for (; selectedIndex < techCards.length && !techCards[selectedIndex].isSelected; selectedIndex++) {}

        if (gpInputs.includes(12) && !lastInputs.includes(12)) {
          selectedElement.isSelected = false;
          selectedElement.style.border = '';

          if (selectedIndex == 0) selectedElement = techCards[techCards.length - 1];
          else selectedElement = techCards[selectedIndex - 1];

          if (selectedElement.getBoundingClientRect().bottom > window.innerHeight) document.getElementById('pause-grid-right').scroll(0, document.getElementById('pause-grid-right').scrollTop + selectedElement.getBoundingClientRect().bottom - window.innerHeight)
          if (selectedElement.getBoundingClientRect().top < 0) document.getElementById('pause-grid-right').scroll(0, document.getElementById('pause-grid-right').scrollTop + selectedElement.getBoundingClientRect().top)
        }
        if (gpInputs.includes(13) && !lastInputs.includes(13)) {
          selectedElement.isSelected = false;
          selectedElement.style.border = '';

          if (selectedIndex == techCards.length - 1) selectedElement = techCards[0];
          else selectedElement = techCards[selectedIndex + 1];

          if (selectedElement.getBoundingClientRect().bottom > window.innerHeight) document.getElementById('pause-grid-right').scroll(0, document.getElementById('pause-grid-right').scrollTop + selectedElement.getBoundingClientRect().bottom - window.innerHeight)
          if (selectedElement.getBoundingClientRect().top < 0) document.getElementById('pause-grid-right').scroll(0, document.getElementById('pause-grid-right').scrollTop + selectedElement.getBoundingClientRect().top)
        }
        if ((gpInputs.includes(14) && !lastInputs.includes(14)) || (gpInputs.includes(15) && !lastInputs.includes(15))) {
          selectedElement.isSelected = false;
          selectedElement.style.border = '';
          selectedElement = document.getElementById('pause-field');
        }
      }

      if ((gpInputs.includes(0) || gpInputs.includes(0)) && typeof selectedElement.onclick == 'function') selectedElement.onclick();

      var joystickDistance = Math.sqrt(gamepad.axes[2]**2 + gamepad.axes[3]**2);
      if (selectedElement != null && joystickDistance > 0.4) {
        document.getElementById('pause-grid-right').scroll(0, document.getElementById('pause-grid-right').scrollTop + gamepad.axes[3] * 5);
      }

      if (gpInputs.includes(1) && !lastInputs.includes(1)) {
        pauseEvent = new Event('keydown');
        pauseEvent.code = input.key.pause;
        window.dispatchEvent(pauseEvent);
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
    }
    
    if (gpInputs.includes(8) && !lastInputs.includes(8)) freeLook = !freeLook;
    if (gpInputs.includes(9) && !lastInputs.includes(9)) {
      pauseEvent = new Event('keydown');
      pauseEvent.code = input.key.pause;
      window.dispatchEvent(pauseEvent);
    }
  }

  // joysticks
  if (freeLook) {
    if (Math.abs(gamepad.axes[2]) > 0.3) simulation.mousePos.x += gamepad.axes[2] * 5;
    if (Math.abs(gamepad.axes[3]) > 0.3) simulation.mousePos.y += gamepad.axes[3] * 5 * (simulation.isInvertedVertical ? -1 : 1);
    setCrosshairPoint();
  } else {
    simulation.mouseDistance = Math.sqrt(gamepad.axes[2]**2 + gamepad.axes[3]**2) * 300;
    if (simulation.mouseDistance < 120) simulation.mouseDistance = 120;
    else simulation.mouseAngle = Math.atan2(gamepad.axes[3] * (simulation.isInvertedVertical ? -1 : 1), gamepad.axes[2]);
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
  wasChoosing = simulation.isChoosing;
}
