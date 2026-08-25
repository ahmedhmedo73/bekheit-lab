import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';
import type { NavView } from './Sidebar';

interface SectionPlaceholderProps {
  view: NavView;
  onNavigateToUsers: () => void;
}

export const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({ view, onNavigateToUsers }) => {
  const getMeta = () => {
    switch (view) {
      case 'samples':
        return {
          title: 'Patient Specimen & Accessioning Directory',
          icon: <Icons.TestTube size={40} className="text-teal" />,
          desc: 'Manage barcode tracking, pre-analytical tube centrifuging, specimen sorting, and STAT accessioning.',
          badge: 'Specimens Module Ready',
        };
      case 'tests':
        return {
          title: 'Diagnostic Test Catalog & Reference Ranges',
          icon: <Icons.Microscope size={40} className="text-primary" />,
          desc: 'Configure normal biological reference intervals, panic alert limits, specimen stability, and test fees.',
          badge: 'Test Catalog',
        };
      case 'qc':
        return {
          title: 'Quality Assurance, Westgard Rules & EQAS',
          icon: <Icons.ShieldCheck size={40} className="text-purple" />,
          desc: 'Monitor Levey-Jennings charts, standard deviations (1s, 2s, 3s), RIQAS external proficiency programs, and ISO 15189 compliance.',
          badge: 'Quality Control v4.2',
        };
      case 'settings':
        return {
          title: 'Laboratory System & Analyzer Interfacing (ASTM/HL7)',
          icon: <Icons.Settings size={40} className="text-muted" />,
          desc: 'Configure bi-directional analyzer connections, HL7 EHR bridges, SMS patient dispatch, and electronic signature keys.',
          badge: 'LIS Configuration',
        };
      default:
        return {
          title: 'Module Under Configuration',
          icon: <Icons.Info size={40} className="text-muted" />,
          desc: 'This clinical module is ready for connection.',
          badge: 'LIMS Core',
        };
    }
  };

  const meta = getMeta();

  return (
    <div className="placeholder-module-wrap">
      <Card variant="glass" className="placeholder-card">
        <div className="placeholder-icon-wrap">{meta.icon}</div>
        <span className="badge badge-teal badge-sm mb-2">{meta.badge}</span>
        <h2 className="placeholder-title">{meta.title}</h2>
        <p className="placeholder-desc">{meta.desc}</p>

        <div className="placeholder-actions">
          <Button
            type="button"
            variant="medical"
            size="md"
            onClick={onNavigateToUsers}
            leftIcon={<Icons.Users size={18} />}
          >
            Go to Staff & Users CRUD Management
          </Button>
        </div>
      </Card>
    </div>
  );
};
