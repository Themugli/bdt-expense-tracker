import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Delete",
  cancelText = "Cancel"
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" 
            onClick={onCancel} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.2 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg"
          >
            <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
            <p className="mb-6 text-sm text-slate-500">{description}</p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onCancel} 
                className="flex-1 rounded-lg bg-slate-100 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
              >
                {cancelText}
              </button>
              <button 
                type="button" 
                onClick={onConfirm} 
                className="flex-1 rounded-lg bg-red-500 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
