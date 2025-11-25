import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Navbar = () => {
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
            <div className="container">
                <Link className="navbar-brand" to="/">{t('app.title')}</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">{t('nav.newsFeed')}</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${location.pathname === '/channels' ? 'active' : ''}`} to="/channels">{t('nav.manageChannels')}</Link>
                        </li>
                    </ul>
                    <div className="d-flex gap-2">
                        <button
                            className={`btn btn-sm ${i18n.language === 'en' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => changeLanguage('en')}
                        >
                            EN
                        </button>
                        <button
                            className={`btn btn-sm ${i18n.language === 'uk' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => changeLanguage('uk')}
                        >
                            UK
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
