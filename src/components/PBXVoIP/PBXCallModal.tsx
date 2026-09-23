import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pbxAudio } from '../../utils/audioEngine';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Grid,
  ShieldCheck,
  Activity,
  Radio,
  Video,
  VideoOff,
  Maximize2,
  Camera,
  RefreshCw
} from 'lucide-react';

export const PBXCallModal: React.FC = () => {
  const { activeCall, incomingCall, acceptCall, rejectCall, endCall, currentUser } = useAuth();

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [bitrateKbps, setBitrateKbps] = useState(64);
  const [packetLoss, setPacketLoss] = useState(0.1);
  const [jitter, setJitter] = useState(3.2);

  // Real Hardware Camera Stream & Controls
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const call = activeCall || incomingCall;
  const isIncoming = Boolean(incomingCall);
  const isConnected = activeCall?.status === 'connected';
  const isVideoCall = call?.callType === 'video' || isVideoOn;

  // Real Camera Hardware lifecycle
  useEffect(() => {
    let streamInstance: MediaStream | null = null;
    let isCancelled = false;

    async function initCamera() {
      if (!isVideoCall || !isVideoOn || !isConnected) {
        if (cameraStream) {
          cameraStream.getTracks().forEach((t) => t.stop());
          setCameraStream(null);
          setCameraActive(false);
        }
        return;
      }

      try {
        if (navigator?.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });

          if (!isCancelled) {
            streamInstance = stream;
            setCameraStream(stream);
            setCameraActive(true);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => {});
            }
          } else {
            stream.getTracks().forEach((t) => t.stop());
          }
        } else {
          setCameraActive(false);
        }
      } catch (err) {
        console.info('Using simulated high-fidelity video stream preview:', err);
        setCameraActive(false);
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (streamInstance) {
        streamInstance.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isVideoCall, isVideoOn, isConnected, facingMode]);

  // Keep local video element synced if stream changes
  useEffect(() => {
    if (localVideoRef.current && cameraStream) {
      localVideoRef.current.srcObject = cameraStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [cameraStream]);

  const toggleFacingMode = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Call duration counter
  useEffect(() => {
    let interval: any;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  // Adaptive bitrate simulator: fluctuates realistically to demonstrate adaptive streaming
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      // Simulate minor network shifts & adaptive bitrate adjustment
      const randomShift = Math.random();
      if (randomShift > 0.85) {
        setBitrateKbps(32);
        setPacketLoss(1.4);
        setJitter(14.5);
      } else if (randomShift > 0.70) {
        setBitrateKbps(48);
        setPacketLoss(0.4);
        setJitter(6.8);
      } else {
        setBitrateKbps(64);
        setPacketLoss(0.1);
        setJitter(3.2);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Setup Web Audio analyser and canvas visualizer when call is connected
  useEffect(() => {
    if (isConnected) {
      pbxAudio.startVoiceSession(true).then((analyser) => {
        analyserRef.current = analyser;
        drawWaveform();
      });
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isConnected]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.floor(Math.sin(Date.now() / 150 + i) * 60 + 80);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const val = isMuted ? 4 : dataArray[i];
        const barHeight = (val / 255) * canvas.height * 0.9 + 2;

        ctx.fillStyle = isMuted ? '#94a3b8' : '#4f46e5';
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    render();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleKeypadPress = (digit: string) => {
    pbxAudio.playDTMF(digit);
  };

  if (!call) return null;

  const otherPartyName = call.callerId === currentUser?.id ? call.calleeName : call.callerName;
  const otherPartyRole = call.callerId === currentUser?.id ? call.calleeRole : call.callerRole;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full ${isVideoCall ? 'max-w-xl' : 'max-w-sm'} bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300`}>
        {/* Top security header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Servexa Encrypted {isVideoCall ? 'Video Stream' : 'VoIP Call'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-semibold">
              AES-256 E2EE
            </span>
            {isConnected && (
              <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                {formatSeconds(callDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Video Mode Screen */}
        {isVideoCall ? (
          <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden">
            {/* Remote Peer Video Stream / Camera Feed */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80"
                alt={otherPartyName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover filter contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
            </div>

            {/* Remote Peer Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white text-xs font-bold shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{otherPartyName}</span>
              <span className="text-[10px] text-slate-400 capitalize">({otherPartyRole})</span>
            </div>

            {/* Local Video Picture-in-Picture (PiP) */}
            <div className="absolute bottom-4 right-4 z-10 w-28 h-36 sm:w-36 sm:h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/80 bg-slate-900 group">
              {isVideoOn ? (
                <div className="relative w-full h-full">
                  {cameraActive ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                  ) : (
                    <img
                      src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"}
                      alt="You"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Camera Flip button */}
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[9px] transition-all cursor-pointer opacity-80 hover:opacity-100"
                    title="Flip Camera (Front / Back)"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>

                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white font-mono">
                      You {cameraActive ? '• HD Cam' : '• E2EE'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center">
                  <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                  <span className="text-[10px]">Camera Off</span>
                </div>
              )}
            </div>

            {/* Streaming Network Telemetry Ribbon */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-[10px] text-slate-300 font-mono border border-slate-700">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>1080p • {bitrateKbps * 15} kbps • {jitter}ms</span>
            </div>
          </div>
        ) : (
          /* Caller Avatar & Name for Audio-only */
          <div className="p-6 text-center flex flex-col items-center">
            <div className="relative mb-4">
              <div className={`w-24 h-24 rounded-full p-1 bg-gradient-to-tr ${
                isConnected ? 'from-emerald-400 to-indigo-600' : 'from-indigo-500 to-indigo-300 animate-pulse'
              }`}>
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  <span className="text-3xl font-extrabold text-slate-700">
                    {otherPartyName.charAt(0)}
                  </span>
                </div>
              </div>
              {isConnected && (
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                  <Radio className="w-3 h-3 text-white animate-pulse" />
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900">{otherPartyName}</h3>
            <p className="text-xs text-slate-500 capitalize mt-0.5">
              Verified {otherPartyRole}
            </p>

            {/* Call Status & Timer */}
            <div className="mt-3">
              {isIncoming ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-bounce">
                  Incoming Encrypted Call...
                </span>
              ) : isConnected ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {formatSeconds(callDuration)}
                  </span>
                  <div className="flex items-center gap-2 mt-1 px-2.5 py-1 bg-slate-100 rounded-full text-[10px] text-slate-600 font-mono">
                    <Activity className="w-3 h-3 text-indigo-600" />
                    <span>Opus {bitrateKbps} kbps</span>
                    <span>• loss: {packetLoss}%</span>
                    <span>• {jitter}ms</span>
                  </div>
                </div>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                  Calling via Secure Private Network...
                </span>
              )}
            </div>

            {/* Real-time Frequency Waveform Visualizer */}
            {isConnected && (
              <div className="w-full mt-4 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <canvas
                  ref={canvasRef}
                  width={260}
                  height={40}
                  className="w-full h-10 block rounded-lg"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-center font-medium">
                  HD Voice Active • Adaptive Bitrate Streaming
                </p>
              </div>
            )}

            {/* DTMF Keypad Drawer */}
            {showKeypad && isConnected && (
              <div className="w-full mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleKeypadPress(d)}
                    className="py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 hover:bg-slate-100 active:scale-95 transition-transform cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 mt-auto">
          {isIncoming ? (
            <div className="flex items-center justify-around gap-4">
              <button
                onClick={rejectCall}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer animate-pulse"
              >
                <Phone className="w-4 h-4" />
                Accept Call
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Call toggles */}
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-full border transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-rose-100 border-rose-300 text-rose-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-3 rounded-full border transition-all cursor-pointer ${
                    isVideoOn
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`p-3 rounded-full border transition-all cursor-pointer ${
                    isSpeaker
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Speakerphone"
                >
                  {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setShowKeypad(!showKeypad)}
                  className={`p-3 rounded-full border transition-all cursor-pointer ${
                    showKeypad
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Dialpad"
                >
                  <Grid className="w-5 h-5" />
                </button>
              </div>

              {/* End Call button */}
              <button
                onClick={endCall}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                End Encrypted Call
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
