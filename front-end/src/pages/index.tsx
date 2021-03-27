import { Container } from '../components/Container';
import { Box } from "@chakra-ui/react";
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import io from "socket.io-client";
import Peer from "simple-peer";
import { useEffect, useRef, useState } from 'react';

const socket = io.connect("http://localhost:5000");

const Index = () => {
  const [me, setMe] = useState("");
  const [stream, setStream]:any = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal]: any = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const video: any = useRef();
  const userVideo: any = useRef();
  const connectionRef: any = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then((stream) => {
      setStream(stream);
      video.current.srcObject = stream;
    });

    socket.on("me", (id:string)=> {
      setMe(id);
    });
    socket.on("callUser", (data: any) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    })
  }, []);

  const callUser = (id: string) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name
      });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    socket.on("callAccepted", (signal: any) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  }

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", {signal: data, to: caller});
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  }

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  }

  return(
    <Container height="100vh">
    <DarkModeSwitch />
    <Box>{stream && <video playsInline muted ref={video} autoPlay />}</Box>
    </Container>
  );
}

export default Index
