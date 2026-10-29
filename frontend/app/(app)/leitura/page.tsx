"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, QrCode } from "lucide-react";
import { extrairProtocolo } from "@estoque/backend/protocolo";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Cartao } from "@/components/ui/cartao";

const INTERVALO_DA_LEITURA_MS = 200;
const LARGURA_MAXIMA_DO_QUADRO = 640;
const PAUSA_APOS_QR_INVALIDO_MS = 2500;

interface DetectorDeCodigo {
  detect: (imagem: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
}
type FabricaDoDetector = new (opcoes: { formats: string[] }) => DetectorDeCodigo;

/** Lê um QR code de um quadro do vídeo: usa o leitor nativo do navegador ou o jsQR. */
async function lerQuadro(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  detector: DetectorDeCodigo | null,
): Promise<string | null> {
  if (detector) {
    const achados = await detector.detect(video);
    return achados[0]?.rawValue ?? null;
  }

  const escala = Math.min(1, LARGURA_MAXIMA_DO_QUADRO / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * escala);
  canvas.height = Math.round(video.videoHeight * escala);
  const contexto = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexto) return null;
  contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imagem = contexto.getImageData(0, 0, canvas.width, canvas.height);
  const { default: jsQR } = await import("jsqr");
  return jsQR(imagem.data, imagem.width, imagem.height)?.data ?? null;
}

/**
 * Leitor de QR code para o estoquista. O QR impresso no PDF do GEDOC também
 * abre `/leitura/<protocolo>` direto pela câmera do celular; esta tela serve
 * para ler de dentro do sistema e, sem câmera, digitar o protocolo.
 */
export default function LeituraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fluxoRef = useRef<MediaStream | null>(null);
  const temporizadorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraLigada, setCameraLigada] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [protocoloDigitado, setProtocoloDigitado] = useState("");
  const [erroDoCampo, setErroDoCampo] = useState<string | undefined>();

  function pararLeitura() {
    if (temporizadorRef.current) clearInterval(temporizadorRef.current);
    temporizadorRef.current = null;
    fluxoRef.current?.getTracks().forEach((faixa) => faixa.stop());
    fluxoRef.current = null;
  }

  // Ao sair da tela, a câmera precisa ser desligada (a luz do aparelho apaga).
  useEffect(() => {
    return () => {
      if (temporizadorRef.current) clearInterval(temporizadorRef.current);
      fluxoRef.current?.getTracks().forEach((faixa) => faixa.stop());
    };
  }, []);

  function desligarCamera() {
    pararLeitura();
    setCameraLigada(false);
  }

  function abrirDocumento(protocolo: string) {
    desligarCamera();
    router.push(`/leitura/${encodeURIComponent(protocolo)}`);
  }

  async function ligarCamera() {
    setAviso(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setAviso(
        "A câmera só funciona em conexão segura (https). Use a câmera do celular para ler o QR code, ou digite o protocolo abaixo.",
      );
      return;
    }

    try {
      const fluxo = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      fluxoRef.current = fluxo;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = fluxo;
      await video.play();
      setCameraLigada(true);

      const Fabrica = (window as unknown as { BarcodeDetector?: FabricaDoDetector }).BarcodeDetector;
      const detector = Fabrica ? new Fabrica({ formats: ["qr_code"] }) : null;
      const canvas = document.createElement("canvas");
      let lendo = false;
      let pausadoAte = 0;

      temporizadorRef.current = setInterval(async () => {
        if (lendo || Date.now() < pausadoAte || video.readyState < 2 || !video.videoWidth) return;
        lendo = true;
        try {
          const texto = await lerQuadro(video, canvas, detector);
          if (!texto) return;
          const protocolo = extrairProtocolo(texto);
          if (protocolo) {
            abrirDocumento(protocolo);
          } else {
            setAviso("Este QR code não é de um documento do GEDOC.");
            pausadoAte = Date.now() + PAUSA_APOS_QR_INVALIDO_MS;
          }
        } catch {
          // Quadro ilegível: tenta de novo no próximo ciclo.
        } finally {
          lendo = false;
        }
      }, INTERVALO_DA_LEITURA_MS);
    } catch (erro) {
      desligarCamera();
      const negada = erro instanceof DOMException && erro.name === "NotAllowedError";
      setAviso(
        negada
          ? "O acesso à câmera foi negado. Libere a câmera para este site nas configurações do navegador."
          : "Não foi possível abrir a câmera deste aparelho. Digite o protocolo abaixo.",
      );
    }
  }

  function aoDigitar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const protocolo = extrairProtocolo(protocoloDigitado);
    if (!protocolo) {
      setErroDoCampo("Protocolo inválido. Exemplo: ORC-20261029-AB12.");
      return;
    }
    setErroDoCampo(undefined);
    abrirDocumento(protocolo);
  }

  return (
    <Pagina
      sobretitulo="Documento de saída"
      titulo="Ler QR code"
      descricao="Aponte a câmera para o QR code do orçamento, da amostra ou da ordem de produção para abrir o documento."
    >
      <div className="space-y-4">
        <Cartao icone={QrCode} titulo="Câmera">
          <div className="overflow-hidden rounded-md bg-slate-900">
            <video
              ref={videoRef}
              playsInline
              muted
              aria-label="Imagem da câmera"
              className={cameraLigada ? "aspect-square w-full object-cover" : "hidden"}
            />
            {!cameraLigada && (
              <div className="grid aspect-video place-items-center text-slate-400">
                <CameraOff className="size-10" aria-hidden />
              </div>
            )}
          </div>

          <div className="mt-3">
            {cameraLigada ? (
              <Botao variante="secundario" icone={CameraOff} onClick={desligarCamera} className="w-full">
                Desligar câmera
              </Botao>
            ) : (
              <Botao icone={Camera} onClick={ligarCamera} className="w-full" tamanho="lg">
                Abrir câmera
              </Botao>
            )}
          </div>
          {aviso && (
            <Alerta tom="atencao" className="mt-3">
              {aviso}
            </Alerta>
          )}
        </Cartao>

        <Cartao titulo="Ou digite o protocolo" descricao="Está impresso no documento, ao lado do QR code.">
          <form onSubmit={aoDigitar} className="space-y-3">
            <Campo
              rotulo="Protocolo"
              value={protocoloDigitado}
              onChange={(evento) => setProtocoloDigitado(evento.target.value)}
              placeholder="ORC-20261029-AB12"
              autoCapitalize="characters"
              autoComplete="off"
              erro={erroDoCampo}
            />
            <Botao type="submit" variante="secundario" className="w-full">
              Abrir documento
            </Botao>
          </form>
        </Cartao>
      </div>
    </Pagina>
  );
}
