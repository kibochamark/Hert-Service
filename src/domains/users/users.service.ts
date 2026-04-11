import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Prisma } from 'generated/prisma/client';
import { CreateUserDto } from 'src/common/validators/user.validators';

@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UsersRepository) { }

    async createUser(data: CreateUserDto) {
        // Add any business logic here before calling the repository
        return this.userRepository.createUser(data);
    }

    async findAllUsers() {
        // Add any business logic here before calling the repository
        return this.userRepository.findAllUsers();
    }

    async findUserById(userId: string) {
        // Add any business logic here before calling the repository
        return this.userRepository.getUserById(userId);
    }

    async updateUser(userId: string, data: Partial<CreateUserDto>) {
        // Add any business logic here before calling the repository
        return this.userRepository.updateUser(userId, data);
    }

    async deleteUser(userId: string) {
        // Add any business logic here before calling the repository
        return this.userRepository.deleteUser(userId);
    }

    async findUsersByCompanyId(companyId: string) {
        // Add any business logic here before calling the repository
        return this.userRepository.findUsersByCompanyId(companyId);
    }

    async createMemberAccountForUser(userId: string, companyId: string) {
        // Add any business logic here before calling the repository
        return this.userRepository.createMemberAccountForUser(userId, companyId);
    }
}
