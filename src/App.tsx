import { useRef } from "react";

const App = () => {
  const gainNodeRef = useRef<GainNode | null>();
  const volumnRef = useRef(0);

  const audioRef = (audio: HTMLAudioElement | null) => {
    if (audio) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true, // 여기서 권한을 받아야 mediaDevices 도 검색이 가능하다.
        })
        .then((stream) => {
          //////////// Search devices
          navigator.mediaDevices.enumerateDevices().then((devices) => {
            // 아래 코드를 이용하여 사용자에게 어떠한 장치를 사용할 것인지 고르게 할 수 있다
            // device.kind 가 audioinput 이면 마이크고
            // device.kind 가 audiooutput 이면 스피커 이다
            // device.kind 가 videoinput 이면 캠이다
            devices.forEach((device) => {
              console.log(
                `kind: ${device.kind} label: ${device.label} id: ${device.deviceId}`
              );
            });
          });

          audio.srcObject = stream;

          // 아래와 같이 setSinkId 로 어느 디바이스로 출력할 것인지 변경할 수 있다(현재 실험적인 메소드라 ts에서는 숨겨져 있다.)
          // HTMLMeidaElement.setSinkId(deviceId);
          // (audio as any).setSinkId(
          //   "e7d66f0588f5e1917b3fd5681ac6bfb7d0fb7c6d60c32fbee61ea346fab896ac"
          // );

          // 하나의 AudioContext instance 로 모든것을 다 작업한다.
          // 작업의 순서는 아래와 같이 진행된다.
          // 1. AudioContext 인스턴스를 만든다.
          // 2. 이 인스턴스의 createXXXSource 메서드로 작업할 source 객체를 만든다.
          // 3. 이 작업할 소스 객체를 특정 이펙트를 부여할 Node 객체와 연결한다.
          // 4. 연결된 객체를 다시 AudioContext 의 destination 과 연결한다.
          const audioContext = new AudioContext();

          const source = audioContext.createMediaStreamSource(stream);
          const gainNode = audioContext.createGain();
          gainNodeRef.current = gainNode;
          const analyserNode = audioContext.createAnalyser();
          analyserNode.smoothingTimeConstant = 0.4;
          analyserNode.fftSize = 1024;
          const scriptNode = audioContext.createScriptProcessor(2048, 1, 1);
          scriptNode.onaudioprocess = () => {
            const array = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(array);
            volumnRef.current =
              array.reduce((acc, cur) => {
                return acc + cur;
              }, 0) / array.length;
          };
          // node connect
          source
            .connect(gainNode)
            .connect(analyserNode)
            .connect(scriptNode)
            .connect(audioContext.destination);
          //
        })
        .catch((error) => {
          console.error(`getUserMedia error : ${error.toString()}`);
        });
    }
  };
  const upButtonClick = () => {
    if (!gainNodeRef.current) return;
    console.log(`User Volumn :${gainNodeRef.current.gain.value}`);
    gainNodeRef.current.gain.value += 0.2;
    if (gainNodeRef.current.gain.value > 20) {
      gainNodeRef.current.gain.value = 20;
    }
  };
  const downButtonClick = () => {
    if (!gainNodeRef.current) return;
    console.log(`User Volumn :${gainNodeRef.current.gain.value}`);
    gainNodeRef.current.gain.value -= 0.2;
    if (gainNodeRef.current.gain.value < 0) {
      // turn off
      gainNodeRef.current.gain.value = 0.1;
    }
  };

  const canvasRef = (canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const draw = () => {
        ctx!.fillStyle = "#fff";
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.fillStyle = "#000";
        ctx!.beginPath();
        ctx!.arc(
          canvas.width / 2,
          canvas.height / 2,
          10 + volumnRef.current / 10,
          0,
          Math.PI * 2,
          true
        );
        ctx!.fill();
        if (volumnRef.current > 20) {
          ctx!.strokeStyle = "#33FF33";
          ctx!.lineWidth = 2;
          ctx!.beginPath();

          ctx!.arc(
            canvas.width / 2,
            canvas.height / 2,
            10 - ctx!.lineWidth / 2 + volumnRef.current / 10,
            0,
            Math.PI * 2,
            true
          );
          ctx!.stroke();
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    }
  };
  return (
    <>
      <audio autoPlay ref={audioRef}></audio>
      <button onClick={upButtonClick}>UP</button>
      <button onClick={downButtonClick}>DOWN</button>
      <canvas
        ref={canvasRef}
        style={{ height: "200px", width: "300px", border: "1px solid black" }}
      ></canvas>
    </>
  );
};

export default App;
