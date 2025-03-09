import * as THREE from "three";

export class SoundManager {
  constructor(camera, soundBuffers) {
    this.camera = camera;
    this.soundBuffers = soundBuffers;
    this.sounds = {};
    this.listener = new THREE.AudioListener();

    // Add listener to camera
    this.camera.add(this.listener);

    // Create audio objects for each sound
    for (const soundName in soundBuffers) {
      this.createSound(soundName, soundBuffers[soundName]);
    }

    // Set up volume control
    this.masterVolume = 1.0;
    this.setupVolumeControl();
  }

  createSound(name, buffer) {
    // Create a positional audio source for 3D sounds
    const sound = new THREE.PositionalAudio(this.listener);

    // Set buffer
    sound.setBuffer(buffer);

    // Set default settings
    sound.setRefDistance(20);
    sound.setMaxDistance(1000);
    sound.setRolloffFactor(1);

    // Store the sound
    this.sounds[name] = sound;
  }

  setupVolumeControl() {
    // Add volume control to settings panel if it exists
    const settingsPanel = document.getElementById("controls-panel");

    if (settingsPanel) {
      // Create volume control element
      const volumeControl = document.createElement("div");
      volumeControl.className = "volume-control";
      volumeControl.innerHTML = `
                <label for="volume-slider">Volume:</label>
                <input type="range" id="volume-slider" min="0" max="100" value="${
                  this.masterVolume * 100
                }">
                <span id="volume-value">${Math.round(
                  this.masterVolume * 100
                )}%</span>
            `;

      // Add to settings panel
      settingsPanel.appendChild(volumeControl);

      // Add event listener
      const volumeSlider = document.getElementById("volume-slider");
      const volumeValue = document.getElementById("volume-value");

      volumeSlider.addEventListener("input", (event) => {
        const volume = parseInt(event.target.value) / 100;
        this.setMasterVolume(volume);
        volumeValue.textContent = `${Math.round(volume * 100)}%`;
      });
    }
  }

  playSound(name, loop = false, volume = 1.0, position = null) {
    const sound = this.sounds[name];

    if (!sound) {
      console.warn(`Sound "${name}" not found.`);
      return;
    }

    // Stop if already playing
    if (sound.isPlaying) {
      sound.stop();
    }

    // Set loop and volume
    sound.setLoop(loop);
    sound.setVolume(volume * this.masterVolume);

    // Set position if provided
    if (position) {
      // Create a dummy object to hold the sound
      const soundObject = new THREE.Object3D();
      soundObject.position.copy(position);
      soundObject.add(sound);

      // Add to scene temporarily
      this.camera.parent.add(soundObject);

      // Remove after sound is done playing
      if (!loop) {
        const duration = sound.buffer.duration * 1000;
        setTimeout(() => {
          soundObject.remove(sound);
          this.camera.parent.remove(soundObject);
        }, duration);
      }
    }

    // Play the sound
    sound.play();

    return sound;
  }

  stopSound(name) {
    const sound = this.sounds[name];

    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  pauseSound(name) {
    const sound = this.sounds[name];

    if (sound && sound.isPlaying) {
      sound.pause();
    }
  }

  resumeSound(name) {
    const sound = this.sounds[name];

    if (sound && !sound.isPlaying) {
      sound.play();
    }
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Update all currently playing sounds
    for (const name in this.sounds) {
      const sound = this.sounds[name];

      if (sound.isPlaying) {
        sound.setVolume(
          (sound.volume / sound.gain.gain.value) * this.masterVolume
        );
      }
    }
  }
}
