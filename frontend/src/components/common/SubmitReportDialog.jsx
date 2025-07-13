import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert
} from '@mui/material';
import {
  Send as SendIcon
} from '@mui/icons-material';
import { httpClient } from '../../utils/api';

const SubmitReportDialog = ({ open, onClose, report, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await httpClient.post(`/progress-reports/${report.id}/submit`);
      onSuccess('Reporte enviado para aprobación exitosamente');
      onClose();
    } catch (error) {
      onSuccess('Error al enviar reporte: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = report && report.status === 'DRAFT';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Enviar Reporte para Aprobación
      </DialogTitle>
      <DialogContent>
        {report && (
          <>
            <Typography variant="body1" gutterBottom>
              ¿Estás seguro que deseas enviar este reporte para aprobación?
            </Typography>
            
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Actividad:</strong> {report.activity?.name || report.indicator?.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Período:</strong> {report.period}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Progreso:</strong> {report.currentValue} / {report.targetValue} ({report.executionPercentage}%)
              </Typography>
            </Box>

            {!canSubmit && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Este reporte no puede ser enviado. Solo los reportes en estado "Borrador" pueden ser enviados para aprobación.
              </Alert>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              Una vez enviado, no podrás modificar el reporte hasta que sea aprobado o rechazado.
            </Alert>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SendIcon />}
          disabled={loading || !canSubmit}
        >
          {loading ? 'Enviando...' : 'Enviar para Aprobación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitReportDialog;
