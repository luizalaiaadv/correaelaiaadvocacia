import { FadeIn } from './fade-in';

export const GallerySection = () => {
  const images = ['/img1.webp', '/img2.webp', '/img3.webp', '/img4.webp'];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">
              Ambiente
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold text-brand mt-4">
              NOSSO ESCRITÓRIO
            </h3>
          </FadeIn>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {images.map((src, index) => (
            <FadeIn
              key={index}
              delay={index * 0.1}
              className="overflow-hidden rounded-2xl aspect-square group"
            >
              <img
                src={src}
                alt={`Escritório ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width={600}
                height={600}
              />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
