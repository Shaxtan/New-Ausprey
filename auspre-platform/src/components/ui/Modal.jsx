import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0" style={{ backgroundColor: 'rgba(15,23,42,.5)' }} onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn('relative w-full bg-white rounded-2xl shadow-float border border-slate-200', widths[size])}
          >
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2.5 p-5 border-t border-slate-100">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
