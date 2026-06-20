'use client';

import { createContext, useContext, useRef, useCallback, useState } from 'react';
import { useFormStore } from '../stores/formStore';
import EditExitConfirm from '../components/EditExitConfirm';

const EditSessionContext = createContext(null);

export function EditSessionProvider({ saveToSupabase, setOriginalLoadedState, children }) {
  const saveRef = useRef(saveToSupabase);
  const baselineRef = useRef(setOriginalLoadedState);
  saveRef.current = saveToSupabase;
  baselineRef.current = setOriginalLoadedState;

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const discardCallbackRef = useRef(null);

  const completeEditAndSave = useCallback(async () => {
    const save = saveRef.current;
    const setBaseline = baselineRef.current;
    if (!save) return;
    await save(true);
    useFormStore.getState().commitEditSession();
    if (setBaseline) {
      setBaseline(useFormStore.getState());
    }
  }, []);

  const abortEditAndRestoreBaseline = useCallback(() => {
    useFormStore.getState().abortEditSession();
    const setBaseline = baselineRef.current;
    if (setBaseline) {
      setBaseline(useFormStore.getState());
    }
  }, []);

  const requestDiscardConfirm = useCallback((onConfirmed) => {
    discardCallbackRef.current = onConfirmed;
    setShowDiscardConfirm(true);
  }, []);

  const handleStay = useCallback(() => {
    setShowDiscardConfirm(false);
    discardCallbackRef.current = null;
    if (typeof window !== 'undefined' && window.__surveyHeaderOverlay) {
      window.__surveyHeaderOverlay.clearLoadingState();
    }
  }, []);

  const handleDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    const cb = discardCallbackRef.current;
    discardCallbackRef.current = null;
    if (cb) cb();
  }, []);

  return (
    <EditSessionContext.Provider
      value={{
        completeEditAndSave,
        abortEditAndRestoreBaseline,
        requestDiscardConfirm,
      }}
    >
      {children}
      <EditExitConfirm
        isOpen={showDiscardConfirm}
        onStay={handleStay}
        onDiscard={handleDiscard}
      />
    </EditSessionContext.Provider>
  );
}

export function useEditSession() {
  const ctx = useContext(EditSessionContext);
  if (!ctx) {
    return {
      completeEditAndSave: async () => {},
      abortEditAndRestoreBaseline: () => {},
      requestDiscardConfirm: (cb) => {
        if (cb) cb();
      },
    };
  }
  return ctx;
}
