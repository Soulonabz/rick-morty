// Frequency bands for the equalizer (in Hz)
const FREQUENCY_BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

class Equalizer {
  constructor(audioContext, sourceNode) {
    this.audioContext = audioContext;
    this.sourceNode = sourceNode;
    this.filters = [];
    this.setupFilters();
  }

  setupFilters() {
    // Create filters for each frequency band
    this.filters = FREQUENCY_BANDS.map(frequency => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'peaking'; // EQ filter type
      filter.frequency.value = frequency;
      filter.Q.value = 1; // Quality factor
      filter.gain.value = 0; // Default gain (no boost/cut)
      return filter;
    });

    // Connect the filters in series
    this.filters.reduce((prev, curr) => {
      prev.connect(curr);
      return curr;
    });
  }

  connectToDestination() {
    // Connect the last filter to the destination
    if (this.filters.length > 0) {
      this.sourceNode.connect(this.filters[0]);
      this.filters[this.filters.length - 1].connect(this.audioContext.destination);
    } else {
      this.sourceNode.connect(this.audioContext.destination);
    }
  }

  // Update the gain value for a specific frequency band
  setGain(index, value) {
    if (index >= 0 && index < this.filters.length) {
      this.filters[index].gain.value = value;
    }
  }

  // Get all frequency bands
  getFrequencyBands() {
    return FREQUENCY_BANDS;
  }

  // Reset all gains to 0
  reset() {
    this.filters.forEach(filter => {
      filter.gain.value = 0;
    });
  }

  // Disconnect and cleanup
  disconnect() {
    this.filters.forEach(filter => {
      filter.disconnect();
    });
  }

  // Apply a preset EQ setting
  applyPreset(preset) {
    switch (preset) {
      case 'bass-boost':
        this.filters.forEach((filter, index) => {
          if (index < 3) filter.gain.value = 7;
          else if (index < 5) filter.gain.value = 3;
          else filter.gain.value = 0;
        });
        break;
      case 'treble-boost':
        this.filters.forEach((filter, index) => {
          if (index > 6) filter.gain.value = 7;
          else if (index > 4) filter.gain.value = 3;
          else filter.gain.value = 0;
        });
        break;
      case 'vocal-boost':
        this.filters.forEach((filter, index) => {
          if (index > 2 && index < 6) filter.gain.value = 5;
          else filter.gain.value = 0;
        });
        break;
      default:
        this.reset();
    }
  }
}

export default Equalizer;
export { FREQUENCY_BANDS }; 