import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { styles } from '../../constants/styles';
import { navLinks } from '../../constants';
import { logo, menu, close } from '../../assets';
import { config } from '../../constants/config';

const Navbar = () => {
  const [active, setActive] = useState<string | null>();
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      if (scrollTop > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
        setActive('');
      }
    };

    window.addEventListener('scroll', handleScroll);

    const navbarHighlighter = () => {
      const sections = document.querySelectorAll('section[id]');

      sections.forEach(current => {
        const sectionId = current.getAttribute('id');
        // @ts-ignore
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.getBoundingClientRect().top - sectionHeight * 0.2;

        if (sectionTop < 0 && sectionTop + sectionHeight > 0) {
          setActive(sectionId);
        }
      });
    };

    window.addEventListener('scroll', navbarHighlighter);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', navbarHighlighter);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`${
        styles.paddingX
      } fixed top-0 z-20 flex w-full items-center py-5 transition-all duration-300 ${
        scrolled
          ? 'bg-primary/90 backdrop-blur-md border-b border-purple-500/25 shadow-lg shadow-purple-500/10'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3 justify-self-start"
          onClick={() => {
            window.scrollTo(0, 0);
          }}
        >
          <img src={logo} alt="Vortex Gaming Cafe" className="h-11 w-11 rounded-lg object-cover" />
          <p className="hidden cursor-pointer whitespace-nowrap text-[17px] font-bold tracking-wider text-white transition-colors hover:text-cyan-400 sm:block">
            {config.html.fullName}
          </p>
        </Link>

        <div className="hidden items-center justify-center lg:flex">
          <ul className="flex list-none flex-row items-center gap-8">
            {navLinks.map(nav => (
              <motion.li
                key={nav.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`${
                  active === nav.id ? 'text-cyan-400 font-bold neon-text-blue' : 'text-secondary'
                } cursor-pointer whitespace-nowrap text-[16px] font-medium hover:text-white transition-all`}
              >
                <a href={`/#${nav.id}`}>{nav.title}</a>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="hidden justify-self-end lg:block" aria-hidden="true" />

        <div className="flex flex-1 items-center justify-end lg:hidden">
          <img
            src={toggle ? close : menu}
            alt="menu"
            className="h-[28px] w-[28px] object-contain cursor-pointer"
            onClick={() => setToggle(!toggle)}
          />

          <div
            className={`${
              !toggle ? 'hidden' : 'flex'
            } black-gradient absolute right-0 top-20 z-10 mx-4 my-2 min-w-[180px] rounded-xl p-6 flex-col gap-4 border border-purple-500/10`}
          >
            <ul className="flex flex-1 list-none flex-col items-start justify-end gap-4">
              {navLinks.map(nav => (
                <li
                  key={nav.id}
                  className={`font-poppins cursor-pointer text-[16px] font-medium ${
                    active === nav.id ? 'text-cyan-400 font-bold' : 'text-secondary'
                  }`}
                  onClick={() => {
                    setToggle(!toggle);
                  }}
                >
                  <a href={`/#${nav.id}`}>{nav.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
