import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getBrowserLanguage, useTranslation } from "./translations";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Admin() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [language] = useState(getBrowserLanguage());
  const navigate = useNavigate();
  
  const { t } = useTranslation(language);

  const handleSync = async () => {
    if (!sheetUrl.trim()) {
      toast.error(t('syncError'));
      return;
    }

    try {
      setSyncing(true);
      setResult(null);

      const response = await axios.post(`${API}/admin/sync-sheet`, null, {
        params: { sheet_url: sheetUrl }
      });

      setResult(response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Sync error:", error);
      const errorMsg = error.response?.data?.detail || t('syncError');
      toast.error(errorMsg);
      setResult({ success: false, message: errorMsg });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="admin-container" data-testid="admin-container">
      <div className="admin-header">
        <Button
          data-testid="back-to-map-btn"
          variant="ghost"
          onClick={() => navigate("/")}
          className="back-btn"
        >
          <ArrowLeft size={20} />
          {t('backToMap')}
        </Button>
        <h1>{t('adminTitle')}</h1>
        <p>{t('syncGoogleSheet')}</p>
      </div>

      <div className="admin-content">
        <div className="sync-card">
          <h2>{t('syncGoogleSheet')}</h2>
          
          <div className="instructions">
            <h3>{t('instructions')}</h3>
            <ol>
              {t('instructionsList').map((instruction, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: instruction }} />
              ))}
            </ol>
          </div>

          <div className="sync-form">
            <Input
              data-testid="sheet-url-input"
              type="text"
              placeholder={t('sheetUrlPlaceholder')}
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              disabled={syncing}
            />
            
            <Button
              data-testid="sync-btn"
              onClick={handleSync}
              disabled={syncing || !sheetUrl.trim()}
              className="sync-btn"
            >
              {syncing ? (
                <>
                  <RefreshCw className="spinning" size={20} />
                  {t('syncing')}
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  {t('syncButton')}
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className={`result ${result.success ? "success" : "error"}`} data-testid="sync-result">
              <div className="result-header">
                {result.success ? (
                  <CheckCircle size={24} />
                ) : (
                  <AlertCircle size={24} />
                )}
                <h3>{result.message}</h3>
              </div>
              
              {result.markers_added && (
                <p>✓ {result.markers_added} {t('markersAdded')}</p>
              )}
              
              {result.geocode_errors && result.geocode_errors.length > 0 && (
                <div className="errors">
                  <p><strong>{t('geocodingErrors')}</strong></p>
                  <ul>
                    {result.geocode_errors.map((name, idx) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
