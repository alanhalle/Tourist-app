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
      toast.error("Por favor, insira a URL do Google Sheet");
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
      const errorMsg = error.response?.data?.detail || "Erro ao sincronizar";
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
          Voltar ao Mapa
        </Button>
        <h1>Painel de Administração</h1>
        <p>Sincronize marcadores do Google Sheets</p>
      </div>

      <div className="admin-content">
        <div className="sync-card">
          <h2>Sincronizar Google Sheet</h2>
          
          <div className="instructions">
            <h3>Instruções:</h3>
            <ol>
              <li>Crie um Google Sheet com as colunas: <strong>Name</strong>, <strong>Category</strong>, <strong>Description</strong></li>
              <li>Categorias válidas: <code>restaurants</code>, <code>hotels</code>, <code>beaches</code>, <code>sights</code></li>
              <li>Compartilhe o sheet publicamente (Qualquer pessoa com o link → Leitor)</li>
              <li>Cole a URL completa do sheet abaixo</li>
            </ol>
          </div>

          <div className="sync-form">
            <Input
              data-testid="sheet-url-input"
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/..."
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
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  Sincronizar
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
                <p>✓ {result.markers_added} marcadores adicionados</p>
              )}
              
              {result.geocode_errors && result.geocode_errors.length > 0 && (
                <div className="errors">
                  <p><strong>Erros de geocodificação:</strong></p>
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
