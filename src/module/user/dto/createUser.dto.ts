
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ArrayNotEmpty, ArrayUnique, Matches } from "class-validator";
import {Role} from "src/role/role.enum";
export class CreateUserDto {

    @ApiProperty({ example: 'sang7cthcsky@gmail.com', description: 'email of the user' })
    @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'email must be a valid email address' })
    @IsNotEmpty({message: 'email should not be empty'})
    email: string

    @ApiProperty({ example: 'Sang123', description: 'password of the user'})
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, { message: 'password must be at least 6 characters long and contain at least one letter and one number' })
    @IsNotEmpty({ message: 'password should not be empty' })
    password: string

    @ApiProperty({ example: 'sang7cthcsky', description: 'username of the user' })
    @IsNotEmpty({ message: 'username should not be empty' })
    username: string
    
    @ApiProperty({
    example: 'USER',
    description: 'roles of the user',
    enum: Role,
    default: Role.USER,
    })
    @IsEnum(Role, { message: 'role must be either USER or ADMIN' })
    @IsOptional() // nếu bạn muốn role mặc định là USER khi không truyền
    roles?: Role = Role.USER;

}