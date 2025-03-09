import Image from 'next/image';

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="relative w-full mb-4">
      <Image
        src="/search.svg"
        alt="Search"
        width={20}
        height={20}
        className="absolute left-3 top-1/2 transform -translate-y-1/2"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="w-full h-[45px] pl-10 pr-4 rounded-[26.24px] bg-[#F9F9F9] border border-[#E8ECF0] focus:outline-none"
      />
    </div>
  );
};

export default SearchBar;
