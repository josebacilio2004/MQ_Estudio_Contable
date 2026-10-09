import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe, Loader2 } from 'lucide-react';
import { api } from '../services/api';

// Caché en memoria para no consultar la misma URL múltiples veces
const metadataCache = new Map();

export default function LinkPreviewCard({ url, label }) {
  const [meta, setMeta] = useState(() => metadataCache.get(url) || null);
  const [loading, setLoading] = useState(!metadataCache.has(url));

  useEffect(() => {
    if (!url) return;
    if (metadataCache.has(url)) {
      setMeta(metadataCache.get(url));
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    api.getLinkMetadata(url)
      .then((data) => {
        if (isMounted) {
          metadataCache.set(url, data);
          setMeta(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallback = {
            title: label || new URL(url).hostname,
            domain: new URL(url).hostname,
            url
          };
          metadataCache.set(url, fallback);
          setMeta(fallback);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url, label]);

  if (!url) return null;

  if (loading) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 hover:border-slate-700 transition"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
        <span className="truncate">{label || url}</span>
        <ExternalLink className="w-3 h-3 text-slate-500 ml-auto shrink-0" />
      </a>
    );
  }

  const domain = meta?.domain || '';
  const title = meta?.title || label || domain;
  const description = meta?.description || '';
  const favicon = meta?.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const image = meta?.image;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2.5 block rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-950 transition-all duration-200 overflow-hidden group shadow-sm"
      title={url}
    >
      <div className="flex flex-col sm:flex-row items-stretch">
        {/* Imagen OpenGraph si existe */}
        {image && (
          <div className="sm:w-32 h-24 sm:h-auto bg-slate-900 shrink-0 overflow-hidden relative">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Contenido de texto y Favicon */}
        <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mb-1">
              <img
                src={favicon}
                alt=""
                className="w-3.5 h-3.5 rounded-sm shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="truncate">{domain}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-1">
              {title}
            </h4>
            {description && (
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold mt-2 pt-1 border-t border-slate-800/60">
            <span>Abrir enlace</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </a>
  );
}
