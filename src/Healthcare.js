import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Hospital,
  UserPlus,
  ClipboardList,
  UserCog,
  AlertCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Healthcare = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(null);
  const [patientID, setPatientID] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [name, setName] = useState("");
  const [treatment, setTreatment] = useState("");
  const [patientRecords, setPatientRecords] = useState([]);
  const [providerAddress, setProviderAddress] = useState("");

  const contractAddress = "0xc5cCa15f2428004cd21D832Cf330a7Ceb5d3BFA4";

  const contractABI = [
    {
      inputs: [
        { internalType: "uint256", name: "patientID", type: "uint256" },
        { internalType: "string", name: "patientName", type: "string" },
        { internalType: "string", name: "diagnosis", type: "string" },
        { internalType: "string", name: "treatment", type: "string" },
      ],
      name: "addRecord",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "provider", type: "address" }],
      name: "authorizeProvider",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    {
      inputs: [],
      name: "getOwner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "patientID", type: "uint256" }],
      name: "getPatientRecords",
      outputs: [
        {
          components: [
            { internalType: "uint256", name: "recordID", type: "uint256" },
            { internalType: "string", name: "patientName", type: "string" },
            { internalType: "string", name: "diagnosis", type: "string" },
            { internalType: "string", name: "treatment", type: "string" },
            { internalType: "uint256", name: "timestamp", type: "uint256" },
          ],
          internalType: "struct HealthcareRecords.Record[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  useEffect(() => {
    const connectWallet = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        setProvider(provider);
        setSigner(signer);

        const accountAddress = await signer.getAddress();
        setAccount(accountAddress);

        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setContract(contract);

        const ownerAddress = await contract.getOwner();
        setIsOwner(accountAddress.toLowerCase() === ownerAddress.toLowerCase());
      } catch (error) {
        console.error("Error connecting to wallet: ", error);
        toast.error("Error connecting to wallet: " + error.message);
      }
    };
    connectWallet();
  }, []);

  const fetchPatientRecords = async () => {
    const patientIDNumber = parseInt(patientID, 10);

    // Check if patientID is a valid number
    if (isNaN(patientIDNumber)) {
      toast.error("Please enter a valid Patient ID (must be a number).");
      return;
    }

    try {
      const records = await contract.getPatientRecords(patientIDNumber);
      setPatientRecords(records);
    } catch (error) {
      console.error("Error fetching patient records", error);
      toast.error("Error fetching patient records: " + error.message);
    }
  };

  const checkIfAuthorized = async () => {
    try {
      const isAuthorized = await contract.authorizeProvider(account);
      if (!isAuthorized) {
        toast.error(
          "You are not authorized to add records. Please contact the contract owner."
        );
      }
      return isAuthorized;
    } catch (error) {
      console.error("Error checking authorization", error);
      toast.error("Error checking authorization: " + error.message);
      return false;
    }
  };

  const addRecord = async () => {
    const patientIDNumber = parseInt(patientID, 10);

    // Check if patientID is a valid number
    if (isNaN(patientIDNumber)) {
      toast.error("Please enter a valid Patient ID (must be a number).");
      return;
    }

    const isAuthorized = await checkIfAuthorized();
    if (!isAuthorized) return;

    try {
      const tx = await contract.addRecord(
        patientIDNumber,
        name,
        diagnosis,
        treatment
      );
      await tx.wait();
      fetchPatientRecords();
      toast.success("Record added successfully");
    } catch (error) {
      console.error("Error adding records", error);
      toast.error("Error adding records: " + error.message);
    }
  };

  const authorizeProvider = async () => {
    if (isOwner) {
      try {
        const tx = await contract.authorizeProvider(providerAddress);
        await tx.wait();
        toast.success(`Provider ${providerAddress} authorized successfully`);
      } catch (error) {
        console.error("Error authorizing provider", error);
        toast.error("Error authorizing provider: " + error.message);
      }
    } else {
      toast.error("Only contract owner can call this function");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Hospital className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                BlockMed
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {account && (
                <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                  <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
              )}
              {isOwner && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Contract Owner
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Fetch Records Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <ClipboardList className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold">Fetch Patient Records</h2>
              </div>
              <div className="space-y-4">
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  type="text"
                  placeholder="Enter Patient ID"
                  value={patientID}
                  onChange={(e) => setPatientID(e.target.value)}
                />
                <button
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  onClick={fetchPatientRecords}
                >
                  Fetch Records
                </button>
              </div>
            </div>

            {/* Add Record Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <UserPlus className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold">Add Patient Record</h2>
              </div>
              <div className="space-y-4">
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  type="text"
                  placeholder="Patient Id"
                  value={patientID}
                  onChange={(e) => setPatientID(e.target.value)}
                />
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  type="text"
                  placeholder="Diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  type="text"
                  placeholder="Treatment"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                />
                <button
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  onClick={addRecord}
                >
                  Add Record
                </button>
              </div>
            </div>

            {/* Authorize Provider Section */}
            {isOwner && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <UserCog className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold">
                    Authorize Healthcare Provider
                  </h2>
                </div>
                <div className="space-y-4">
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    placeholder="Provider Address"
                    value={providerAddress}
                    onChange={(e) => setProviderAddress(e.target.value)}
                  />
                  <button
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                    onClick={authorizeProvider}
                  >
                    Authorize Provider
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Patient Records */}
          <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto max-h-201">
            <div className="flex items-center mb-6">
              <ClipboardList className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">Patient Records</h2>
            </div>
            {patientRecords.length > 0 ? (
              <div className="space-y-6">
                {patientRecords.map((record, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Record Name</p>
                        <p className="font-medium mb-2">{record.patientName}</p>
                        <p className="text-sm text-gray-500">Record ID</p>
                        <p className="font-medium">
                          {record.recordID.toNumber()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Timestamp</p>
                        <p className="font-medium">
                          {new Date(
                            record.timestamp.toNumber() * 1000
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Diagnosis</p>
                        <p className="font-medium">{record.diagnosis}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Treatment</p>
                        <p className="font-medium">{record.treatment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p>
                  No records found. Enter a patient ID and click "Fetch
                  Records".
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Healthcare;
