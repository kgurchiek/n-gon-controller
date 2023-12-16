javascript:(() => {
  function buttonPressed(b) {
    if (typeof b === 'object') {
      return b.pressed;
    }
    return b === 1.0;
  }

	simulation.mouseDistance = 40;
  simulation.mouseAngle = 0;

  function setCrosshair() {
    var mCanvasPos = {
      x: ((m.pos.x + m.transX - canvas.width2) /  simulation.edgeZoomOutSmooth) * simulation.zoom + canvas.width2,
      y: simulation.mouse.y = ((m.pos.y + m.transY - canvas.height2) /  simulation.edgeZoomOutSmooth) * simulation.zoom + canvas.height2
    }

    simulation.mouse.x = mCanvasPos.x + Math.cos(simulation.mouseAngle) * simulation.mouseDistance;
    simulation.mouse.y = mCanvasPos.y + Math.sin(simulation.mouseAngle) * simulation.mouseDistance;
    
    simulation.mouseInGame.x = (simulation.mouse.x - canvas.width2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.width2 - m.transX;
    simulation.mouseInGame.y = (simulation.mouse.y - canvas.height2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.height2 - m.transY;
  }

  window.addEventListener("gamepadconnected", (e) => {
    console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}. ${e.gamepad.buttons.length} buttons, ${e.gamepad.axes.length} axes.`)
    requestAnimationFrame(loop);
  });

  var lastInputs = [];
	var crouchToggled = false;
  function loop() {
    const gpInputs = [];
    const gamepad = navigator.getGamepads()[0];
    
		// buttons
    for (var i = 0; i < gamepad.buttons.length; i++) if (buttonPressed(gamepad.buttons[i])) gpInputs.push(i);
    if (simulation.paused) {
      if (gpInputs.includes(1) || (gpInputs.includes(9) && !lastInputs.includes(9))) {
        build.unPauseGrid();
        simulation.paused = false;
        document.body.style.cursor = "none";
        requestAnimationFrame(cycle);
      }
    } else {
      input.up = gpInputs.includes(0);
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
      if (gpInputs.includes(4) && !lastInputs.includes(4)) simulation.previousGun();
      if (gpInputs.includes(5) && !lastInputs.includes(5)) simulation.nextGun();
      input.field = gpInputs.includes(6);
      input.fire = gpInputs.includes(7);
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
    simulation.mouseDistance = Math.sqrt(gamepad.axes[2]**2 + gamepad.axes[3]**2) * 100;
    if (simulation.mouseDistance < 40) simulation.mouseDistance = 40;
    else simulation.mouseAngle = Math.atan2(gamepad.axes[3], gamepad.axes[2]);
    setCrosshair();
    
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
    

//     if (gpInputs.length > 0) console.log(gpInputs, input.up);
    console.log(crouchToggled);

    lastInputs = gpInputs;
    requestAnimationFrame(loop);
  }
})();
