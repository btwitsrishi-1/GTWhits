type SoundName =
  | "click"
  | "coin"
  | "win"
  | "lose"
  | "mine-explode"
  | "gem-reveal"
  | "plinko-land"
  | "roulette-spin"
  | "card-deal"
  | "card-flip"
  | "cashout"
  | "bet";

const SOUND_PATHS: Record<SoundName, string> = {
  click: "/assets/sounds/click.mp3",
  coin: "/assets/sounds/coin.mp3",
  win: "/assets/sounds/win.mp3",
  lose: "/assets/sounds/lose.mp3",
  "mine-explode": "/assets/sounds/mine-explode.mp3",
  "gem-reveal": "/assets/sounds/gem-reveal.mp3",
  "plinko-land": "/assets/sounds/plinko-land.mp3",
  "roulette-spin": "/assets/sounds/roulette-spin.mp3",
  "card-deal": "/assets/sounds/card-deal.mp3",
  "card-flip": "/assets/sounds/card-flip.mp3",
  cashout: "/assets/sounds/cashout.mp3",
  bet: "/assets/sounds/bet.mp3",
};

class SoundManager {
  private cache = new Map<string, HTMLAudioElement>();
  private _enabled = true;
  private _volume = 0.5;

  get enabled() {
    return this._enabled;
  }

  get volume() {
    return this._volume;
  }

  toggle() {
    this._enabled = !this._enabled;
    return this._enabled;
  }

  setEnabled(enabled: boolean) {
    this._enabled = enabled;
  }

  setVolume(volume: number) {
    this._volume = Math.max(0, Math.min(1, volume));
  }

  play(name: SoundName) {
    if (!this._enabled || typeof window === "undefined") return;

    const path = SOUND_PATHS[name];
    if (!path) return;

    try {
      // Use cloned audio for overlapping sounds
      let source = this.cache.get(path);
      if (!source) {
        source = new Audio(path);
        this.cache.set(path, source);
      }

      const audio = source.cloneNode() as HTMLAudioElement;
      audio.volume = this._volume;
      audio.play().catch(() => {
        // Ignore autoplay errors silently
      });
    } catch {
      // Ignore errors if audio isn't available
    }
  }

  preload(...names: SoundName[]) {
    if (typeof window === "undefined") return;
    for (const name of names) {
      const path = SOUND_PATHS[name];
      if (path && !this.cache.has(path)) {
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = path;
        this.cache.set(path, audio);
      }
    }
  }
}

// Singleton
export const soundManager = new SoundManager();
export type { SoundName };
