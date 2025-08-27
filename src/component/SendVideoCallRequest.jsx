"use client";
import { CameraIcon } from "@heroicons/react/24/solid";
import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
import { useParams } from "next/navigation";
import { useUser } from "@/context/UserProvider";
import peer from "@/services/peer";
import ReactPlayer from "react-player";
const SendVideoCallRequest = () => {
  const socket = useSocket();
  const { userId } = useParams();
  const { user } = useUser();
  const [sender, setSender] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteSteam, setRemoteStream] = useState(null);

  const handleSendCallRequest = useCallback(async () => {
    try {
      // const stream = await navigator.mediaDevices.getUserMedia({
      //   audio: true,
      //   video: true,
      // });
      const offer = await peer.getOffer();

      // // Add tracks immediately ✅
      // for (const track of stream.getTracks()) {
      //   peer.peer.addTrack(track, stream);
      // }
      socket.emit("call:request", { from: user, to: userId, offer });
      // setMyStream(stream);
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
    },
    [socket, sender, user, myStream, incomingOffer]
  );

  const handleReject = () => {
    socket.emit("call:reject", { from: sender, to: user.id });
    setSender(null);
    setIncomingOffer(null);
  };

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

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

  const handleAcceptNego = useCallback(
    async ({ offer, from, to }) => {
      const ans = await peer.getAnswer(offer);

      socket.emit("nego:accepted", { to: from.id, ans });
      sendStreams();
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
  }, [ ]);

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

    return () => {
      socket.off("receive:call:request", onReceiveCall);
      socket.off("call:accepted", handleCallAccept);
      socket.off("nego:accepted", handleFinalNego);
      socket.off("nego:offer", handleAcceptNego);
    };
  }, [socket, handleCallAccept, handleAcceptNego, handleFinalNego]);

  return (
    <>
      <button
        onClick={handleSendCallRequest}
        className="p-2 rounded bg-blue-500 hover:bg-blue-600 hover:cursor-pointer"
      >
        <CameraIcon className="h-6 w-6 text-white" />
      </button>

      {/* Modal */}
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
      {(myStream || remoteSteam) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <video
              ref={(videoEl) => {
                if (videoEl && myStream) {
                  videoEl.srcObject = myStream;
                }
              }}
              autoPlay
              muted
              playsInline
              className="w-full h-auto rounded-lg"
            />
          </div>
          {/* <button className="bg-purple-700" onClick={sendStreams}>
            Send Stream
          </button> */}
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <video
              ref={(videoEl) => {
                if (videoEl && remoteSteam) {
                  videoEl.srcObject = remoteSteam;
                }
              }}
              autoPlay
              muted
              playsInline
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SendVideoCallRequest;
