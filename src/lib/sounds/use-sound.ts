"use client";

import { useEffect, useCallback } from "react";
import { useSoundStore } from "@/stores/sound-store";
import { soundManager, type SoundName } from "./sound-manager";

export function useSound() {
  const { enabled, volume } = useSoundStore();

  useEffect(() => {
    soundManager.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    soundManager.setVolume(volume);
  }, [volume]);

  const play = useCallback((name: SoundName) => {
    soundManager.play(name);
  }, []);

  return { play };
}
