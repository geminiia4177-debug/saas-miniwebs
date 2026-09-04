"use client";

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { createPortal } from "react-dom";

interface IframePreviewProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  onLoad?: () => void;
}

export const IframePreview = forwardRef<HTMLIFrameElement, IframePreviewProps>(
  ({ children, className = "", style = {}, title = "Vista Previa", onLoad }, ref) => {
    const internalRef = useRef<HTMLIFrameElement>(null);
    useImperativeHandle(ref, () => internalRef.current as HTMLIFrameElement);

    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

    useEffect(() => {
      const iframe = internalRef.current;
      if (!iframe) return;

      const setupIframe = () => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        // Limpiar estilos existentes en el head del iframe
        const head = doc.head;
        head.innerHTML = `
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <base target="_blank" />
        `;

        // Copiar todos los tags <link rel="stylesheet"> y <style> del documento padre
        const styleElements = document.querySelectorAll("link[rel='stylesheet'], style");
        styleElements.forEach((el) => {
          head.appendChild(el.cloneNode(true));
        });

        // Configuración de body y estilo base
        doc.body.className = "bg-transparent overflow-x-hidden antialiased";
        doc.body.style.margin = "0";
        doc.body.style.padding = "0";
        doc.body.style.minHeight = "100%";
        doc.body.style.fontFamily = "var(--font-sans), 'Plus Jakarta Sans', system-ui, sans-serif";

        // Reenviar mensajes de postMessage desde el iframe hacia la ventana principal
        if (iframe.contentWindow) {
          iframe.contentWindow.addEventListener("message", (event) => {
            if (event.data?.type === "EDIT_SECTION") {
              window.postMessage(event.data, "*");
            }
          });
        }

        setMountNode(doc.body);
        if (onLoad) onLoad();
      };

      // Si el iframe ya está cargado
      if (iframe.contentDocument?.readyState === "complete") {
        setupIframe();
      } else {
        iframe.addEventListener("load", setupIframe);
      }

      // Observador para mantener estilos sincronizados en caso de cambios en tiempo de desarrollo
      const observer = new MutationObserver((mutations) => {
        const doc = iframe.contentDocument;
        if (!doc) return;
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === "STYLE" || (node.nodeName === "LINK" && (node as HTMLLinkElement).rel === "stylesheet")) {
              doc.head.appendChild(node.cloneNode(true));
            }
          });
        });
      });

      observer.observe(document.head, { childList: true });

      return () => {
        iframe.removeEventListener("load", setupIframe);
        observer.disconnect();
      };
    }, [onLoad]);

    return (
      <iframe
        ref={internalRef}
        title={title}
        className={className}
        style={{
          border: "none",
          width: "100%",
          height: "100%",
          display: "block",
          ...style,
        }}
      >
        {mountNode && createPortal(children, mountNode)}
      </iframe>
    );
  }
);

IframePreview.displayName = "IframePreview";
