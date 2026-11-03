import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface pt-16 pb-12 border-t border-outline-variant/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-outline/30">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl">
                <span className="material-symbols-outlined text-2xl">corporate_fare</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                CSR<span className="text-secondary-container">Connect</span>
              </span>
            </div>
            <p className="text-sm text-surface-container-high leading-relaxed">
              Connecting Villages and Gram Sansthas with Corporate CSR Partners across India with 100% verified partnerships, milestone transparency, and direct impact tracking.
            </p>
            <p className="text-xs text-secondary-container font-medium">
              Connecting Villages with Corporate CSR Partners.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-surface-container-high">
              <li><Link to="/" className="hover:text-white transition-colors">Home Page</Link></li>
              <li><Link to="/campaigns" className="hover:text-white transition-colors">Browse Projects</Link></li>
              <li><Link to="/ngos" className="hover:text-white transition-colors">Village Directory</Link></li>
              <li><Link to="/csr" className="hover:text-white transition-colors">CSR Connect</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register as CSR Donor</Link></li>
              <li><Link to="/ngo/registration" className="hover:text-white transition-colors">Register as Village/Sanstha</Link></li>
            </ul>
          </div>

          {/* Governance & Tax Benefits */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Transparency</h4>
            <ul className="space-y-2.5 text-sm text-surface-container-high">
              <li><span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-emerald-400 text-sm">verified</span> Schedule VII Project Alignment</span></li>
              <li><span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-emerald-400 text-sm">verified</span> NITI Aayog Darpan Verified</span></li>
              <li><span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-emerald-400 text-sm">verified</span> MCA CSR-1 Compliance Checks</span></li>
              <li><span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-emerald-400 text-sm">verified</span> Milestone & Utilization Audits</span></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support Helpline</h4>
            <div className="space-y-3 text-sm text-surface-container-high">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed">call</span>
                +91 79 2658 0000 / 1800 233 4455
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed">mail</span>
                support@csrconnect.org
              </p>
              <p className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary-fixed">location_on</span>
                3rd Floor, Social Impact Hub, Ashram Road, Ahmedabad, Gujarat 380009
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-outline-variant">
          <p>© {new Date().getFullYear()} CSR Connect. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/login" className="hover:text-white transition-colors">Grievance Officer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
