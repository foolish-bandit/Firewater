// app.jsx — router + main render

const { useState, useEffect } = React;

function getParam(key, fallback) {
  return new URLSearchParams(location.search).get(key) || fallback;
}

function App() {
  const [page, setPage] = useState(getParam('page', 'landing'));
  const mode = getParam('mode', 'dark');

  useEffect(() => {
    document.body.dataset.mode = mode;
  }, [mode]);

  // keep query in sync for reloads
  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set('page', page);
    window.history.replaceState(null, '', url);
    window.scrollTo(0, 0);
  }, [page]);

  const pages = {
    landing: window.PageLanding,
    discover: window.PageDiscover,
    catalog: window.PageCatalog,
    detail: window.PageDetail,
    profile: window.PageProfile,
    dispatch: window.PageDispatch,
    article: window.PageArticle,
    download: window.PageDownload,
    about: window.PageAbout,
    signin: window.PageSignin,
  };

  const Page = pages[page] || pages.landing;
  const isLanding = page === 'landing';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav page={page} onNav={setPage} />
      <main style={{ flex: 1 }}>
        <Page onNav={setPage} />
      </main>
      <Footer onNav={setPage} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
