javascript:(() => {
  function buttonPressed(b) {
    if (typeof b === 'object') {
      return b.pressed;
    }
    return b === 1.0;
  }

  window.addEventListener("gamepadconnected", (e) => {
    console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}. ${e.gamepad.buttons.length} buttons, ${e.gamepad.axes.length} axes.`)
    requestAnimationFrame(loop);
  });

  var lastInputs = [];
  function loop() {
    const gpInputs = [];
    const gamepad = navigator.getGamepads()[0];
    for (var i = 0; i < gamepad.buttons.length; i++) if (buttonPressed(gamepad.buttons[i])) gpInputs.push(i);
    input.up = gpInputs.includes(0);
    if (m.onGround) {
      if (gpInputs.includes(1) && !lastInputs.includes(1)) input.down = !input.down;
    } else input.down = gpInputs.includes(1);
    if (gpInputs.includes(4) && !lastInputs.includes(4)) simulation.previousGun();
    if (gpInputs.includes(5) && !lastInputs.includes(5)) simulation.nextGun();
    input.field = gpInputs.includes(6);
    input.fire = gpInputs.includes(7);
    if (gpInputs.includes(9) && !lastInputs.includes(9)) {
      if (!simulation.isChoosing && m.alive) {
        if (simulation.paused) {
          build.unPauseGrid();
          simulation.paused = false;
          document.body.style.cursor = "none";
          requestAnimationFrame(cycle);
        } else if (!tech.isNoDraftPause) {
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

    if (gpInputs.length > 0) console.log(gpInputs, input.up);

    lastInputs = gpInputs;
    requestAnimationFrame(loop);
  }
})();
