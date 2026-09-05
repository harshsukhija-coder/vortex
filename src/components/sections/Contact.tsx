import { motion } from 'framer-motion';
import { EarthCanvas } from '../canvas';
import { SectionWrapper } from '../../hoc';
import { slideIn } from '../../utils/motion';
import { config } from '../../constants/config';
import { Header } from '../atoms/Header';

const Contact = () => {
  return (
    <div className={`flex flex-col-reverse gap-10 overflow-hidden xl:mt-12 xl:flex-row`}>
      <motion.div
        variants={slideIn('left', 'tween', 0.2, 1)}
        className="bg-black-100 flex-[0.75] rounded-2xl p-8 flex flex-col justify-center border border-white/5 backdrop-blur-md relative overflow-hidden group"
      >
        {/* Futuristic background grid lines inside card */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff05_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Custom neon glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00f0ff] rounded-full blur-[100px] opacity-20 pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#ff007f] rounded-full blur-[100px] opacity-15 pointer-events-none" />

        <div className="relative z-10">
          <Header useMotion={false} {...config.contact} />

          <p className="text-secondary mt-6 text-[16px] leading-[26px] font-light max-w-lg">
            {config.contact.description}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href={config.contact.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#25d366]/90 to-[#128c7e]/90 px-4 py-4 text-center text-[14px] font-semibold text-white shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:from-[#25d366] hover:to-[#128c7e] hover:shadow-[0_0_25px_rgba(37,211,102,0.6)] active:translate-y-0 active:scale-95 group/btn"
            >
              {/* Premium Inline SVG WhatsApp Icon */}
              <svg
                className="w-6 h-6 fill-current transition-transform duration-300 group-hover/btn:rotate-12"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.967C16.59 1.973 14.113 1.011 11.99 1.011c-5.437 0-9.862 4.371-9.866 9.8.001 1.936.549 3.824 1.59 5.49L2.73 20.895l4.917-1.288-.002-.003c.001 0 0 0 0 0zm12.52-5.482c-.328-.164-1.94-.959-2.24-1.069-.3-.11-.519-.165-.736.165-.218.329-.844 1.069-1.036 1.289-.191.22-.383.247-.71.082-.328-.164-1.387-.511-2.64-1.63-1.03-.919-1.724-2.053-1.926-2.383-.203-.329-.022-.507.142-.671.147-.148.328-.384.492-.575.164-.192.219-.329.328-.549.11-.22.055-.412-.027-.576-.082-.164-.736-1.776-1.008-2.433-.265-.647-.534-.56-.736-.57l-.629-.01c-.218 0-.574.082-.875.412-.3.329-1.149 1.124-1.149 2.741 0 1.618 1.176 3.18 1.34 3.4 1.64 2.158 2.502 3.298 3.826 3.82.88.347 1.684.341 2.302.249.69-.103 1.94-.795 2.212-1.565.273-.77.273-1.428.191-1.565-.082-.137-.3-.218-.629-.382z" />
              </svg>
              <span>Join WhatsApp Group</span>
            </a>

            <a
              href={config.contact.instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] px-4 py-4 text-center text-[14px] font-semibold text-white shadow-[0_0_15px_rgba(225,48,108,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(225,48,108,0.6)] active:translate-y-0 active:scale-95 group/btn"
            >
              <svg
                className="w-6 h-6 fill-current transition-transform duration-300 group-hover/btn:rotate-12"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
              </svg>
              <span>Follow on Instagram</span>
            </a>

            <div className="flex items-center justify-center gap-3 pt-1 sm:col-span-2">
              <span className="text-[12px] uppercase tracking-wider text-secondary">
                Active Circle
              </span>
              <span className="h-1 w-1 rounded-full bg-cyan-400" />
              <span className="text-[14px] text-white/80 font-medium">Ahmedabad Squad</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={slideIn('right', 'tween', 0.2, 1)}
        className="h-[350px] md:h-[550px] xl:h-auto xl:flex-1"
      >
        <EarthCanvas />
      </motion.div>
    </div>
  );
};

export default SectionWrapper(Contact, 'contact');
