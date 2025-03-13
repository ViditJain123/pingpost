'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/home/Card';
import Calendar from '@/components/home/Calender';
import SearchBar from '@/components/home/SearchBar';


export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [cardOffsets, setCardOffsets] = useState({});
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cardData = [
    {
      id: '1',
      title: "Quantum Computing Updates",
      description: "Breaking down recent quantum computing breakthroughs and their potential impact on cryptography and optimization problems"
    },
    {
      id: '2',
      title: "Edge AI Implementation",
      description: "How edge computing is revolutionizing AI deployment with real-time processing and reduced latency in IoT devices"
    },
    {
      id: '3',
      title: "Web3 Development Insights",
      description: "Exploring decentralized applications, blockchain protocols, and the future of trustless infrastructure"
    },
    {
      id: '4',
      title: "RISC-V Architecture Adoption",
      description: "The rise of open-source hardware architecture and how it's challenging traditional processor ecosystems"
    },
    {
      id: '5',
      title: "Neuromorphic Computing",
      description: "Brain-inspired computing systems that promise to revolutionize machine learning and artificial intelligence"
    },
    {
      id: '6',
      title: "Digital Twin Technology",
      description: "Virtual replicas of physical systems that enable real-time monitoring, predictive maintenance, and simulation testing"
    },
    {
      id: '7',
      title: "Post-Quantum Cryptography",
      description: "Preparing for a quantum future with encryption techniques designed to withstand quantum computing attacks"
    },
    {
      id: '8',
      title: "Federated Learning Systems",
      description: "Privacy-preserving machine learning that trains algorithms across decentralized devices without sharing raw data"
    },
    {
      id: '9',
      title: "eBPF Technology Deep Dive",
      description: "How extended Berkeley Packet Filter is transforming Linux kernel programmability and observability"
    },
    {
      id: '10',
      title: "Rust for Systems Programming",
      description: "Why memory-safe programming with Rust is gaining traction for critical infrastructure and embedded systems"
    }
  ];

  // Filter out cards that are already assigned to calendar
  const availableCards = cardData.filter(
    card => !tasks.some(task => task.id === card.id)
  );

  const filteredCards = availableCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTaskAdd = (task) => {
    setTasks(prev => [...prev, task]);
  };

  const handleTaskRemove = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleCardHeightChange = useCallback((index, extraHeight) => {
    setCardOffsets(prev => {
      // Only update if the height actually changed
      if (prev[index] === extraHeight) return prev;

      const newOffsets = { ...prev };
      for (let i = index + 1; i < cardData.length; i++) {
        newOffsets[i] = extraHeight;
      }
      return newOffsets;
    });
  }, [cardData.length]);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="relative h-screen bg-[#F9F9F9] overflow-hidden flex flex-col md:flex-row pl-16">
        {/* Left section with Search and Cards */}
        <section className="w-full md:w-[369px] mt-[100px] mx-4 md:ml-10 mb-10 h-[calc(100vh-140px)] bg-white rounded-[14.01px] p-4 flex flex-col shadow-md min-w-0">
          {/* Fixed search bar */}
          <div className="mb-4">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {/* Scrollable cards container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            {filteredCards.map((card, index) => (
              <div
                key={card.id}
                style={{
                  transform: `translateY(${cardOffsets[index] || 0}px)`,
                  transition: 'transform 200ms ease-in-out'
                }}
              >
                <Card
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  searchTerm={searchTerm}
                  index={index}
                  onHeightChange={handleCardHeightChange}
                  id={card.id}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Right section with Calendar */}
        <section className="flex-1 mt-[100px] mx-4 md:mx-10 mb-10 h-[calc(100vh-140px)]">
          <div className="w-full h-full bg-white rounded-[14.01px] p-6 shadow-lg relative">
            <Calendar
              year={new Date().getFullYear()}
              month={new Date().getMonth()}
              tasks={tasks}
              onTaskAdd={handleTaskAdd}
              onTaskRemove={handleTaskRemove}
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute bottom-6 right-6 px-8 py-2.5 rounded-lg bg-gradient-to-r from-[#4776E6] to-[#8E54E9] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Schedule
            </button>
          </div>
        </section>

        {/* Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Confirm Scheduling</h3>
              <p className="mb-4">Are you sure you want to schedule these posts?</p>
              <p className="text-gray-600 text-sm mb-6 p-4 bg-gray-50 rounded-lg">
                Note: Once scheduled, you'll need to use the LinkedIn website or app to modify or delete the scheduled posts.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Add your scheduling logic here
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#4776E6] to-[#8E54E9] text-white hover:opacity-90 transition-opacity"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}