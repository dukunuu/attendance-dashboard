import {
  Calendar,
  Home,
  ChevronDown,
  User2,
  ChevronUp,
  UserPen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "./ui/button";
import { signOutAction } from "@/app/actions";
import { truncateWithDots } from "./courses/helpers";

// Menu items.
const items = [
  {
    title: "Нүүр хуудас",
    url: "#",
    icon: Home,
  },
  {
    title: "Хичээл",
    url: "/courses",
    icon: Calendar,
    collapsed: true,
  },
  {
    title: "Сурагчид",
    url: "/students",
    icon: UserPen,
  },
];
function NavCoursesSkeleton() {
  return (
    <SidebarMenuSub>
      {Array.from({ length: 5 }).map((_, index) => (
        <SidebarMenuSubItem key={index}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

async function NavCourses() {
  const getCourses = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("courses").select("id, name");
    if (error) {
      return [];
    }
    return data;
  };
  const courses = (await getCourses()) as Array<{ id: number; name: string }>;

  return (
    <SidebarMenuSub>
      {courses.length !== 0 ? (
        courses.map((course) => (
          <SidebarMenuSubItem key={course.id}>
            <SidebarMenuSubButton asChild>
              <Link href={`/courses/${course.id}`}>
                {truncateWithDots(course.name, 20)}
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))
      ) : (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton asChild>
            <Link href="/courses/add">Хичээл нэмэх</Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}
    </SidebarMenuSub>
  );
}
export async function AppSidebar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select()
    .eq("id", user!.id)
    .single<User>();
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Ирц бүргэлийн систем</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) =>
                item.collapsed ? (
                  <Collapsible defaultOpen key={item.title}>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuAction asChild>
                        <CollapsibleTrigger asChild>
                          <ChevronDown />
                        </CollapsibleTrigger>
                      </SidebarMenuAction>
                      <CollapsibleContent>
                        <React.Suspense fallback={<NavCoursesSkeleton />}>
                          <NavCourses />
                        </React.Suspense>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> Username
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="min-w-[15rem] w-max">
                <DropdownMenuItem asChild>
                  <Link
                    className="flex justify-evenly gap-2 items-center cursor-pointer"
                    href="#"
                  >
                    {profile?.image_url ? (
                      <img
                        src={profile.image_url}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User2 />
                    )}
                    <div className="flex flex-col gap-2">
                      <span>{user?.email}</span>
                      <span className="text-xs text-foreground/50">
                        {profile?.first_name} {profile?.last_name}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form className="w-full" action={signOutAction}>
                    <Button className="w-full" type="submit">
                      Sign out
                    </Button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
