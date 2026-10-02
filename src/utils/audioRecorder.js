// src/utils/audioRecorder.js

export class AudioRecorder {
  constructor() {
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.analyser = null;
    this.animFrameId = null;
    this.startTime = 0;
    this.mimeType = 'audio/webm';
  }

  /**
   * Khởi động thu âm từ Microphone
   * @param {(volume: number) => void} [onVolume] - Callback nhận biên độ âm lượng (0 - 100)
   */
  async start(onVolume) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Trình duyệt của bạn không hỗ trợ thu âm Microphone qua Web API.');
    }

    // 1. Xin quyền micro
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 2. Xác định MIME type tối ưu được hỗ trợ
    const preferredTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    this.mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.mediaStream, this.mimeType ? { mimeType: this.mimeType } : {});

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // 3. Thiết lập Web Audio API để đo âm lượng thời gian thực (Soundwave Feedback)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const updateVolume = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalizedVol = Math.min(100, Math.round((avg / 128) * 100));

          if (typeof onVolume === 'function') {
            onVolume(normalizedVol);
          }

          this.animFrameId = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      }
    } catch (e) {
      console.warn('[AudioRecorder] Không thể khởi tạo AudioContext analyser:', e);
    }

    this.startTime = Date.now();
    this.mediaRecorder.start(100); // chunk mỗi 100ms
  }

  /**
   * Dừng thu âm và trả về audio Blob hoàn chỉnh
   * @returns {Promise<{ blob: Blob, duration: number, mimeType: string }>}
   */
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('MediaRecorder chưa được khởi tạo.'));
      }

      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const blob = new Blob(this.audioChunks, { type: this.mimeType || 'audio/webm' });

        this.cleanup();
        resolve({
          blob,
          duration,
          mimeType: this.mimeType || 'audio/webm',
        });
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        this.cleanup();
        reject(err);
      }
    });
  }

  /**
   * Hủy bỏ quá trình thu âm không lưu
   */
  cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    this.cleanup();
  }

  cleanup() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.audioChunks = [];
  }
}
