import { Injectable, Logger } from '@nestjs/common';
// V6 FIX: Import 'keccak256' and 'toUtf8Bytes' directly
import { keccak256, toUtf8Bytes } from 'ethers';
import { RegisterBatchDto } from './dto/register-batch.dto';

// --- FAKE SERVICE FOR TESTING ---
// This simulates the Hedera Smart Contract
@Injectable()
export class FakeMedicineContractService {
  // 0 = Unknown, 1 = Authentic, 2 = Redeemed
  private medicineStatus = new Map<string, number>();

  constructor() {
    // Pre-load a redeemed box for testing
    // V6 FIX: Update hashing function
    const redeemedHash = keccak256(toUtf8Bytes('SN-789-XYZ'));
    this.medicineStatus.set(redeemedHash, 2);
  }

  async registerBatch(hashes: string[]): Promise<boolean> {
    hashes.forEach(hash => {
      this.medicineStatus.set(hash, 1); // 1 = Authentic
    });
    return true;
  }

  async getMedicineStatus(serialHash: string): Promise<number> {
    return this.medicineStatus.get(serialHash) || 0; // 0 = Unknown
  }
}
// --- END OF FAKE SERVICE ---

@Injectable()
export class MedicineAuthService {
  private readonly logger = new Logger(MedicineAuthService.name);

  constructor(
    // Inject the fake contract service
    private readonly contractService: FakeMedicineContractService,
  ) {}

  /**
   * Hashes a list of serial numbers and sends them to the smart contract.
   * This is called by the MANUFACTURER.
   */
  async registerNewBatch(dto: RegisterBatchDto): Promise<any> {
    this.logger.log(`Registering new batch with ${dto.serialNumbers.length} items...`);

    // 1. Convert serial numbers to keccak256 hashes
    const hashes = dto.serialNumbers.map(serial => {
      // V6 FIX: Call functions directly instead of via 'utils'
      return keccak256(toUtf8Bytes(serial));
    });

    // 2. Send the list of hashes to the smart contract (fake)
    await this.contractService.registerBatch(hashes);

    return {
      message: `Batch registered successfully. ${hashes.length} serials added.`,
      hashes: hashes,
    };
  }

  /**
   * Checks the status of a single serial number.
   * This is called by the PHARMACIST.
   */
  async verifyMedicine(serialNumber: string): Promise<any> {
    this.logger.log(`Verifying serial number: ${serialNumber}`);

    // 1. Hash the incoming serial number to match the on-chain format
    // V6 FIX: Call functions directly
    const serialHash = keccak256(toUtf8Bytes(serialNumber));

    // 2. Get the status from the smart contract (fake)
    const statusCode = await this.contractService.getMedicineStatus(serialHash);

    // 3. Interpret the status code
    let status: string;
    let isAuthentic: boolean;
    let message: string;

    switch (statusCode) {
      case 1:
        status = 'Authentic';
        isAuthentic = true;
        message = 'This medicine is authentic and available.';
        break;
      case 2:
        status = 'Redeemed';
        isAuthentic = false;
        message = 'FLAGGED: This medicine is authentic but has ALREADY been sold. Do not dispense.';
        break;
      default: // This includes case 0
        status = 'Unknown';
        isAuthentic = false;
        message = 'This medicine is NOT authentic (Unknown).';
    }

    return { serialNumber, status, isAuthentic, message };
  }
}