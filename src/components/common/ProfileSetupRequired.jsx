import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ProfileSetupRequired
 * Reusable banner/card prompting users to create their corporate or NGO profile
 * before accessing profile-dependent functionality.
 *
 * @param {Object} props
 * @param {'COMPANY' | 'NGO' | 'company' | 'ngo'} [props.role='COMPANY']
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.buttonText]
 * @param {string} [props.targetPath]
 */
export default function ProfileSetupRequired({
  role = 'COMPANY',
  title,
  description,
  buttonText,
  targetPath,
}) {
  const isNgo = String(role).toUpperCase() === 'NGO';

  const defaultTitle = 'Profile Setup Required';
  const defaultDesc = isNgo
    ? 'Please complete your NGO organization registration profile before accessing this section.'
    : 'Please complete your Corporate entity profile before accessing this section.';
  const defaultPath = isNgo ? '/ngo/registration-flow' : '/company/profile';
  const defaultButtonText = isNgo ? 'Create NGO Profile' : 'Create Company Profile';

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-6 font-outfit">
      <div
        className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
          isNgo ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-3xl">
          {isNgo ? 'corporate_fare' : 'domain_add'}
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
          {title || defaultTitle}
        </h2>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
          {description || defaultDesc}
        </p>
      </div>

      <div className="pt-2">
        <Link
          to={targetPath || defaultPath}
          className={`inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold rounded-xl text-white shadow-xs transition-all ${
            isNgo
              ? 'bg-secondary hover:bg-secondary-container hover:shadow'
              : 'bg-primary hover:bg-primary-container hover:shadow'
          }`}
        >
          <span>{buttonText || defaultButtonText}</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
