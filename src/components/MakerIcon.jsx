/** Small discoverability link — not part of in-app profile. */
const URL = 'https://mahmodfaqe.github.io/'

export default function MakerIcon() {
  return (
    <a
      href={URL}
      className="maker-icon"
      target="_blank"
      rel="noopener noreferrer"
      title="Mahmood Faqe"
      aria-label="Mahmood Faqe"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 12c4.4 0 8 2.2 8 5v1H4v-1c0-2.8 3.6-5 8-5Z"
        />
      </svg>
    </a>
  )
}
