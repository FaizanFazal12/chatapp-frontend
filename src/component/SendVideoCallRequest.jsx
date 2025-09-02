"use client";
import {
  CameraIcon,
  PhoneXMarkIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/solid";
import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
import { useParams } from "next/navigation";
import { useUser } from "@/context/UserProvider";
import peer from "@/services/peer";

const SendVideoCallRequest = () => {
  const socket = useSocket();
  const { userId } = useParams();
  const { user } = useUser();
  const [sender, setSender] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteSteam, setRemoteStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const handleSendCallRequest = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const offer = await peer.getOffer();

      // // Add tracks immediately ✅
      // for (const track of stream.getTracks()) {
      //   peer.peer.addTrack(track, stream);
      // }
      socket.emit("call:request", { from: user, to: userId, offer });
      setMyStream(stream);
    } catch (error) {
      console.error("error", error);
    }
  }, [socket, user, userId]);

  const handleIncomingCall = useCallback(
    async (offer) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const ans = await peer.getAnswer(offer);

      socket.emit("call:accepted", { to: sender.id, from: user, ans });

      setMyStream(stream);

      setSender(null);
      setIncomingOffer(null);
      for (const track of stream.getTracks()) {
        peer.peer.addTrack(track, stream);
      }
    },
    [socket, sender, user, myStream, incomingOffer]
  );

  const handleReject = () => {
    socket.emit("call:reject", { from: sender, to: user.id });
    setSender(null);
    setIncomingOffer(null);
  };

  const handleCallAccept = useCallback(
    async ({ from, ans }) => {
      console.log("I HAVE SEND THE CALL AND OTHER USER ACCEPTED IT");
      await peer.setLocalDescription(ans);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      // console.log('')
      // sendStreams();
      for (const track of stream.getTracks()) {
        peer.peer.addTrack(track, stream);
      }
    },
    [myStream]
  );

  const handleCallEnd = useCallback(
    ({ from }) => {
      if (myStream) {
        myStream.getTracks().forEach((track) => {
          track.stop();
        });
        setMyStream(null);
      }

      if (remoteSteam) {
        setRemoteStream(null);
      }
    },
    [myStream, remoteSteam, socket, user, userId]
  );
  // 🎤 Toggle microphone
  const toggleMic = useCallback(() => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setMicEnabled(track.enabled);
      });
    }
  }, [micEnabled, myStream]);

  // 📷 Toggle camera
  const toggleCamera = useCallback(() => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setCamEnabled(track.enabled);
      });
    }
  }, [camEnabled, myStream]);

  // ❌ End call
  const handleEndCall = useCallback(async () => {
    await myStream.getTracks().forEach((track) => track.stop());

    setRemoteStream(null);
    setMyStream(null);

    socket.emit("call:end", { from: user.id, to: userId });
  }, [myStream, remoteSteam]);

  const handleAcceptNego = useCallback(
    async ({ offer, from, to }) => {
      const ans = await peer.getAnswer(offer);

      socket.emit("nego:accepted", { to: from.id, ans });
      // sendStreams();
      // for (const track of myStream.getTracks()) {
      //   peer.peer.addTrack(track, myStream);
      // }
    },
    [socket, myStream]
  );

  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const remoteSteam = ev.streams;

      console.log("remoteSteam", remoteSteam);
      console.log("GOT TRACKS!!");
      // sendStreams();
      setRemoteStream(remoteSteam[0]);
    });
  }, []);

  const handleFinalNego = useCallback(
    async ({ ans }) => {
      // console.log("ans", ans);
      await peer.setLocalDescription(ans);

      //  sendStreams();

      // sendStreams();
    },
    [myStream]
  );

  // ✅ only set this ONCE

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();

    socket.emit("nego:offer", { offer, to: userId, from: user });
  }, [socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    const onReceiveCall = ({ sender, offer }) => {
      setSender(sender);
      setIncomingOffer(offer);
    };

    socket.on("receive:call:request", onReceiveCall);
    socket.on("call:accepted", handleCallAccept);
    socket.on("nego:offer", handleAcceptNego);
    socket.on("nego:accepted", handleFinalNego);
    socket.on("call:end", handleCallEnd);

    return () => {
      socket.off("receive:call:request", onReceiveCall);
      socket.off("call:accepted", handleCallAccept);
      socket.off("nego:accepted", handleFinalNego);
      socket.off("nego:offer", handleAcceptNego);
      socket.off("call:end", handleCallEnd);
    };
  }, [
    socket,
    handleCallAccept,
    handleAcceptNego,
    handleFinalNego,
    handleCallEnd,
  ]);

  return (
    <>
      <button
        onClick={handleSendCallRequest}
        className="p-2 rounded bg-blue-500 hover:bg-blue-600 hover:cursor-pointer"
      >
        <CameraIcon className="h-6 w-6 text-white" />
      </button>

      {/* Incoming Call Modal */}
      {sender && incomingOffer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📞 Incoming Call
            </h2>
            <p className="text-gray-600 mb-6">
              {sender.name} is calling you...
            </p>
            <div className="flex justify-between">
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Reject
              </button>
              <button
                onClick={() => handleIncomingCall(incomingOffer)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Screen */}
      {(myStream || remoteSteam) && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50 gap-4 p-4">
          <div className="flex gap-4">
            {/* My video */}
            <video
              ref={(videoEl) => {
                if (videoEl && myStream) {
                  videoEl.srcObject = myStream;
                }
              }}
              autoPlay
              playsInline
              className="w-auto h-96 rounded-lg bg-gray-900"
            />
            {/* Remote video */}
            <video
              ref={(videoEl) => {
                if (videoEl && remoteSteam) {
                  videoEl.srcObject = remoteSteam;
                }
              }}
              autoPlay
              playsInline
              className="w-auto h-96  rounded-lg bg-gray-900"
            />
          </div>

          {/* Controls */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={toggleMic}
              className="p-3 rounded-full bg-gray-100 hover:bg-blue-100"
              title="Toggle Microphone"
            >
              {micEnabled ? (
                <MicrophoneIcon className="h-6 w-6 text-gray-700" />
              ) : (
                <MicrophoneIcon className="h-6 w-6 text-red-500 line-through" />
              )}
            </button>
            <button
              onClick={toggleCamera}
              className="p-3 rounded-full bg-gray-100 hover:bg-blue-100"
              title="Toggle Camera"
            >
              {camEnabled ? (
                <CameraIcon className="h-6 w-6 text-gray-700" />
              ) : (
                <CameraIcon className="h-6 w-6 text-red-500 line-through" />
              )}
            </button>
            <button
              onClick={handleEndCall}
              className="p-3 rounded-full bg-red-500 hover:bg-red-600"
              title="End Call"
            >
              <PhoneXMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SendVideoCallRequest;
