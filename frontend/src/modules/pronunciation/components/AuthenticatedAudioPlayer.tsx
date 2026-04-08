import { useEffect, useState } from "react";
import { Skeleton, Typography } from "antd";
import api from "@/utils/axiosClient";

const { Text } = Typography;

type Props = {
  src: string;
  className?: string;
  width?: number | string;
};

function AuthenticatedAudioPlayer({ src, className, width = "100%" }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let localObjectUrl: string | null = null;
    let cancelled = false;

    const loadAudio = async () => {
      setLoading(true);
      setFailed(false);

      try {
        const response = await api.get(src, { responseType: "blob" });
        if (cancelled) {
          return;
        }

        localObjectUrl = URL.createObjectURL(response.data);
        setObjectUrl(localObjectUrl);
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAudio();

    return () => {
      cancelled = true;
      if (localObjectUrl) {
        URL.revokeObjectURL(localObjectUrl);
      }
    };
  }, [src]);

  if (loading) {
    return <Skeleton.Button active size="small" style={{ width, minWidth: 160 }} />;
  }

  if (failed || !objectUrl) {
    return <Text type="secondary">Không tải được audio</Text>;
  }

  return <audio controls src={objectUrl} className={className} style={{ width }} />;
}

export default AuthenticatedAudioPlayer;
